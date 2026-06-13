package lk.dev.notepad.controller;

import lk.dev.notepad.dto.ws.CursorMessage;
import lk.dev.notepad.dto.ws.ErrorMessage;
import lk.dev.notepad.dto.ws.OperationMessage;
import lk.dev.notepad.dto.ws.PresenceMessage;
import lk.dev.notepad.entity.Document;
import lk.dev.notepad.entity.Operation;
import lk.dev.notepad.entity.User;
import lk.dev.notepad.repository.DocumentRepository;
import lk.dev.notepad.repository.OperationRepository;
import lk.dev.notepad.repository.UserRepository;
import lk.dev.notepad.service.DocumentService;
import lk.dev.notepad.service.OperationalTransformService;
import lk.dev.notepad.service.PresenceService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

import java.security.Principal;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Controller
@RequiredArgsConstructor
@Slf4j
public class WebSocketController {

    private final SimpMessagingTemplate messagingTemplate;
    private final OperationalTransformService otService;
    private final PresenceService presenceService;
    private final DocumentService documentService;
    private final DocumentRepository documentRepository;
    private final OperationRepository operationRepository;
    private final UserRepository userRepository;

    private final Map<String, Long[]> sessionDocumentUser = new ConcurrentHashMap<>();

    @MessageMapping("/document.join")
    public void joinDocument(@Payload OperationMessage message,
                             SimpMessageHeaderAccessor headerAccessor,
                             Principal principal) {
        try {
            User user = resolveUser(principal);
            Long documentId = message.getDocumentId();

            if (!documentService.canView(documentId, user)) {
                sendError(principal.getName(), "ACCESS_DENIED", "You do not have access to this document");
                return;
            }

            String sessionId = headerAccessor.getSessionId();
            sessionDocumentUser.put(sessionId, new Long[]{documentId, user.getId()});

            presenceService.userJoined(documentId, user.getId(), user.getUsername(), user.getColor());

            PresenceMessage presence = presenceService.getPresence(documentId);
            messagingTemplate.convertAndSend("/topic/document." + documentId + ".presence", presence);

            Document document = documentRepository.findById(documentId)
                    .orElseThrow(() -> new RuntimeException("Document not found"));

            Long serverRevision = operationRepository.findMaxRevisionByDocument(document);

            OperationMessage syncMessage = OperationMessage.builder()
                    .documentId(documentId)
                    .userId(user.getId())
                    .username(user.getUsername())
                    .color(user.getColor())
                    .type(Operation.OperationType.RETAIN)
                    .position(0)
                    .text(document.getContent())
                    .length(0)
                    .revision(serverRevision)
                    .build();

            messagingTemplate.convertAndSendToUser(
                    principal.getName(),
                    "/queue/document.sync",
                    syncMessage
            );

            log.info("User {} joined document {}", user.getUsername(), documentId);

        } catch (Exception e) {
            log.error("Error joining document: {}", e.getMessage());
            sendError(principal.getName(), "JOIN_ERROR", e.getMessage());
        }
    }

    @MessageMapping("/document.operation")
    public void handleOperation(@Payload OperationMessage message, Principal principal) {
        try {
            User user = resolveUser(principal);
            Long documentId = message.getDocumentId();

            if (!documentService.canEdit(documentId, user)) {
                sendError(principal.getName(), "EDIT_DENIED", "You do not have edit access");
                return;
            }

            message.setUserId(user.getId());
            message.setUsername(user.getUsername());
            message.setColor(user.getColor());

            Document document = documentRepository.findById(documentId)
                    .orElseThrow(() -> new RuntimeException("Document not found"));

            Long serverRevision = operationRepository.findMaxRevisionByDocument(document);

            OperationMessage transformed = message;
            if (message.getRevision() < serverRevision) {
                java.util.List<Operation> concurrentOps = operationRepository
                        .findByDocumentAndRevisionGreaterThanOrderByRevisionAsc(
                                document, message.getRevision()
                        );

                for (Operation concurrentOp : concurrentOps) {
                    OperationMessage concurrent = toOperationMessage(concurrentOp, user);
                    transformed = otService.transform(transformed, concurrent);
                }
            }

            String newContent = otService.applyOperation(document.getContent(), transformed);
            documentService.updateContent(documentId, newContent);

            Long newRevision = serverRevision + 1;
            transformed.setRevision(newRevision);

            Operation operation = Operation.builder()
                    .document(document)
                    .user(user)
                    .type(transformed.getType())
                    .position(transformed.getPosition())
                    .text(transformed.getText())
                    .length(transformed.getLength() != null ? transformed.getLength() : 0)
                    .revision(newRevision)
                    .build();

            operationRepository.save(operation);

            messagingTemplate.convertAndSend(
                    "/topic/document." + documentId + ".operations",
                    transformed
            );

            log.info("Operation applied on doc {} by {} rev {}", documentId, user.getUsername(), newRevision);

        } catch (Exception e) {
            log.error("Error handling operation: {}", e.getMessage());
            sendError(principal.getName(), "OPERATION_ERROR", e.getMessage());
        }
    }

    @MessageMapping("/document.cursor")
    public void handleCursor(@Payload CursorMessage message, Principal principal) {
        try {
            User user = resolveUser(principal);
            message.setUserId(user.getId());
            message.setUsername(user.getUsername());
            message.setColor(user.getColor());

            messagingTemplate.convertAndSend(
                    "/topic/document." + message.getDocumentId() + ".cursors",
                    message
            );
        } catch (Exception e) {
            log.error("Error handling cursor: {}", e.getMessage());
        }
    }

    @MessageMapping("/document.leave")
    public void leaveDocument(@Payload OperationMessage message, Principal principal) {
        try {
            User user = resolveUser(principal);
            Long documentId = message.getDocumentId();

            presenceService.userLeft(documentId, user.getId());

            PresenceMessage presence = presenceService.getPresence(documentId);
            messagingTemplate.convertAndSend(
                    "/topic/document." + documentId + ".presence",
                    presence
            );

            log.info("User {} left document {}", user.getUsername(), documentId);
        } catch (Exception e) {
            log.error("Error on leave: {}", e.getMessage());
        }
    }

    @EventListener
    public void handleDisconnect(SessionDisconnectEvent event) {
        String sessionId = event.getSessionId();
        Long[] docUser = sessionDocumentUser.remove(sessionId);

        if (docUser != null) {
            Long documentId = docUser[0];
            Long userId = docUser[1];

            presenceService.userLeft(documentId, userId);

            PresenceMessage presence = presenceService.getPresence(documentId);
            messagingTemplate.convertAndSend(
                    "/topic/document." + documentId + ".presence",
                    presence
            );

            log.info("User {} disconnected from document {}", userId, documentId);
        }
    }

    private User resolveUser(Principal principal) {
        return userRepository.findByEmail(principal.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    private void sendError(String user, String code, String message) {
        messagingTemplate.convertAndSendToUser(
                user,
                "/queue/errors",
                ErrorMessage.builder().code(code).message(message).build()
        );
    }

    private OperationMessage toOperationMessage(Operation op, User user) {
        return OperationMessage.builder()
                .documentId(op.getDocument().getId())
                .userId(op.getUser().getId())
                .username(op.getUser().getUsername())
                .color(op.getUser().getColor())
                .type(op.getType())
                .position(op.getPosition())
                .text(op.getText())
                .length(op.getLength())
                .revision(op.getRevision())
                .build();
    }
}