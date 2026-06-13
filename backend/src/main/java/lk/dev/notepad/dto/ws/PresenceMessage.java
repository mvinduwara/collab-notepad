package lk.dev.notepad.dto.ws;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PresenceMessage {
    private Long documentId;
    private List<UserPresence> activeUsers;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UserPresence {
        private Long userId;
        private String username;
        private String color;
    }
}