package lk.dev.notepad.service;

import lk.dev.notepad.dto.ws.PresenceMessage;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class PresenceService {

    private final Map<Long, Map<Long, PresenceMessage.UserPresence>> documentUsers
            = new ConcurrentHashMap<>();

    public void userJoined(Long documentId, Long userId, String username, String color) {
        documentUsers.computeIfAbsent(documentId, k -> new ConcurrentHashMap<>())
                .put(userId, PresenceMessage.UserPresence.builder()
                        .userId(userId)
                        .username(username)
                        .color(color)
                        .build());
    }

    public void userLeft(Long documentId, Long userId) {
        Map<Long, PresenceMessage.UserPresence> users = documentUsers.get(documentId);
        if (users != null) {
            users.remove(userId);
            if (users.isEmpty()) {
                documentUsers.remove(documentId);
            }
        }
    }

    public PresenceMessage getPresence(Long documentId) {
        Map<Long, PresenceMessage.UserPresence> users = documentUsers.getOrDefault(
                documentId, new ConcurrentHashMap<>()
        );
        return PresenceMessage.builder()
                .documentId(documentId)
                .activeUsers(new ArrayList<>(users.values()))
                .build();
    }

    public List<Long> getActiveDocuments(Long userId) {
        List<Long> active = new ArrayList<>();
        documentUsers.forEach((docId, users) -> {
            if (users.containsKey(userId)) active.add(docId);
        });
        return active;
    }
}