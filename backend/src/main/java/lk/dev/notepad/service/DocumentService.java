package lk.dev.notepad.service;

import lk.dev.notepad.dto.document.*;
import lk.dev.notepad.entity.Document;
import lk.dev.notepad.entity.DocumentCollaborator;
import lk.dev.notepad.entity.DocumentVersion;
import lk.dev.notepad.entity.User;
import lk.dev.notepad.repository.DocumentCollaboratorRepository;
import lk.dev.notepad.repository.DocumentRepository;
import lk.dev.notepad.repository.DocumentVersionRepository;
import lk.dev.notepad.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DocumentService {

    private final DocumentRepository documentRepository;
    private final DocumentCollaboratorRepository collaboratorRepository;
    private final DocumentVersionRepository versionRepository;
    private final UserRepository userRepository;

    @Transactional
    public DocumentResponse createDocument(CreateDocumentRequest request, User owner) {
        Document document = Document.builder()
                .title(request.getTitle())
                .content(request.getContent())
                .shareToken(UUID.randomUUID().toString().replace("-", "").substring(0, 12))
                .sharePermission(request.getSharePermission())
                .owner(owner)
                .build();

        documentRepository.save(document);
        return toDocumentResponse(document);
    }

    @Transactional(readOnly = true)
    public List<DocumentSummaryResponse> getMyDocuments(User user) {
        return documentRepository.findAllAccessibleByUser(user)
                .stream()
                .map(this::toSummaryResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public DocumentResponse getDocument(Long id, User user) {
        Document document = findDocumentById(id);
        assertCanView(document, user);
        return toDocumentResponse(document);
    }

    @Transactional
    public DocumentResponse updateDocument(Long id, UpdateDocumentRequest request, User user) {
        Document document = findDocumentById(id);
        assertCanEdit(document, user);

        if (request.getTitle() != null) document.setTitle(request.getTitle());
        if (request.getContent() != null) document.setContent(request.getContent());
        if (request.getSharePermission() != null && isOwner(document, user)) {
            document.setSharePermission(request.getSharePermission());
        }

        documentRepository.save(document);
        return toDocumentResponse(document);
    }

    @Transactional
    public void deleteDocument(Long id, User user) {
        Document document = findDocumentById(id);
        if (!isOwner(document, user)) {
            throw new RuntimeException("Only the owner can delete this document");
        }
        documentRepository.delete(document);
    }

    @Transactional
    public DocumentResponse addCollaborator(Long documentId,
                                            AddCollaboratorRequest request,
                                            User owner) {
        Document document = findDocumentById(documentId);
        if (!isOwner(document, owner)) {
            throw new RuntimeException("Only the owner can add collaborators");
        }

        User collaboratorUser = userRepository.findByEmail(request.getUsernameOrEmail())
                .or(() -> userRepository.findByUsername(request.getUsernameOrEmail()))
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (collaboratorUser.getId().equals(owner.getId())) {
            throw new RuntimeException("Owner cannot be added as a collaborator");
        }

        if (collaboratorRepository.existsByDocumentAndUser(document, collaboratorUser)) {
            DocumentCollaborator existing = collaboratorRepository
                    .findByDocumentAndUser(document, collaboratorUser)
                    .orElseThrow();
            existing.setPermission(request.getPermission());
            collaboratorRepository.save(existing);
        } else {
            DocumentCollaborator collaborator = DocumentCollaborator.builder()
                    .document(document)
                    .user(collaboratorUser)
                    .permission(request.getPermission())
                    .build();
            collaboratorRepository.save(collaborator);
        }

        return toDocumentResponse(documentRepository.findById(documentId).orElseThrow());
    }

    @Transactional
    public void removeCollaborator(Long documentId, Long userId, User owner) {
        Document document = findDocumentById(documentId);
        if (!isOwner(document, owner)) {
            throw new RuntimeException("Only the owner can remove collaborators");
        }

        User collaboratorUser = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        collaboratorRepository.deleteByDocumentAndUser(document, collaboratorUser);
    }

    @Transactional(readOnly = true)
    public DocumentResponse getDocumentByShareToken(String token, User user) {
        Document document = documentRepository.findByShareToken(token)
                .orElseThrow(() -> new RuntimeException("Document not found"));

        if (document.getSharePermission() == Document.SharePermission.VIEW) {
            return toDocumentResponse(document);
        }

        if (user != null) {
            if (!collaboratorRepository.existsByDocumentAndUser(document, user)
                    && !isOwner(document, user)) {
                DocumentCollaborator collaborator = DocumentCollaborator.builder()
                        .document(document)
                        .user(user)
                        .permission(DocumentCollaborator.Permission.EDIT)
                        .build();
                collaboratorRepository.save(collaborator);
            }
        }

        return toDocumentResponse(document);
    }

    @Transactional
    public void saveVersion(Long documentId, User user) {
        Document document = findDocumentById(documentId);
        assertCanEdit(document, user);

        int nextVersion = versionRepository.findMaxVersionNumberByDocument(document) + 1;

        DocumentVersion version = DocumentVersion.builder()
                .document(document)
                .savedBy(user)
                .content(document.getContent())
                .versionNumber(nextVersion)
                .build();

        versionRepository.save(version);
    }

    @Transactional
    public DocumentResponse restoreVersion(Long documentId, Integer versionNumber, User user) {
        Document document = findDocumentById(documentId);
        assertCanEdit(document, user);

        DocumentVersion version = versionRepository
                .findByDocumentAndVersionNumber(document, versionNumber)
                .orElseThrow(() -> new RuntimeException("Version not found"));

        document.setContent(version.getContent());
        documentRepository.save(document);
        return toDocumentResponse(document);
    }

    @Transactional
    public void updateContent(Long documentId, String content) {
        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new RuntimeException("Document not found"));
        document.setContent(content);
        documentRepository.save(document);
    }

    public boolean canEdit(Long documentId, User user) {
        Document document = findDocumentById(documentId);
        if (isOwner(document, user)) return true;
        return collaboratorRepository.findByDocumentAndUser(document, user)
                .map(c -> c.getPermission() == DocumentCollaborator.Permission.EDIT)
                .orElse(false);
    }

    public boolean canView(Long documentId, User user) {
        Document document = findDocumentById(documentId);
        if (isOwner(document, user)) return true;
        return collaboratorRepository.existsByDocumentAndUser(document, user);
    }

    private Document findDocumentById(Long id) {
        return documentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Document not found"));
    }

    private boolean isOwner(Document document, User user) {
        return document.getOwner().getId().equals(user.getId());
    }

    private void assertCanView(Document document, User user) {
        if (!isOwner(document, user)
                && !collaboratorRepository.existsByDocumentAndUser(document, user)) {
            throw new RuntimeException("Access denied");
        }
    }

    private void assertCanEdit(Document document, User user) {
        if (isOwner(document, user)) return;
        collaboratorRepository.findByDocumentAndUser(document, user)
                .filter(c -> c.getPermission() == DocumentCollaborator.Permission.EDIT)
                .orElseThrow(() -> new RuntimeException("Edit access denied"));
    }

    private DocumentResponse toDocumentResponse(Document document) {
        List<DocumentResponse.CollaboratorInfo> collaborators = document.getCollaborators()
                .stream()
                .map(c -> DocumentResponse.CollaboratorInfo.builder()
                        .userId(c.getUser().getId())
                        .username(c.getUser().getUsername())
                        .color(c.getUser().getColor())
                        .permission(c.getPermission().name())
                        .joinedAt(c.getJoinedAt())
                        .build())
                .collect(Collectors.toList());

        return DocumentResponse.builder()
                .id(document.getId())
                .title(document.getTitle())
                .content(document.getContent())
                .shareToken(document.getShareToken())
                .sharePermission(document.getSharePermission())
                .owner(DocumentResponse.OwnerInfo.builder()
                        .id(document.getOwner().getId())
                        .username(document.getOwner().getUsername())
                        .color(document.getOwner().getColor())
                        .build())
                .collaborators(collaborators)
                .createdAt(document.getCreatedAt())
                .updatedAt(document.getUpdatedAt())
                .build();
    }

    private DocumentSummaryResponse toSummaryResponse(Document document) {
        return DocumentSummaryResponse.builder()
                .id(document.getId())
                .title(document.getTitle())
                .shareToken(document.getShareToken())
                .ownerUsername(document.getOwner().getUsername())
                .collaboratorCount(document.getCollaborators().size())
                .createdAt(document.getCreatedAt())
                .updatedAt(document.getUpdatedAt())
                .build();
    }
}