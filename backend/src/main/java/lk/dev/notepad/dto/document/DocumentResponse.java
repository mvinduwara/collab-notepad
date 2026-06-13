package lk.dev.notepad.dto.document;

import lk.dev.notepad.entity.Document;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DocumentResponse {
    private Long id;
    private String title;
    private String content;
    private String shareToken;
    private Document.SharePermission sharePermission;
    private OwnerInfo owner;
    private List<CollaboratorInfo> collaborators;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OwnerInfo {
        private Long id;
        private String username;
        private String color;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CollaboratorInfo {
        private Long userId;
        private String username;
        private String color;
        private String permission;
        private LocalDateTime joinedAt;
    }
}