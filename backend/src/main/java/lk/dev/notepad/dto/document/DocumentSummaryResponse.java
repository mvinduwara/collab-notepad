package lk.dev.notepad.dto.document;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DocumentSummaryResponse {
    private Long id;
    private String title;
    private String shareToken;
    private String ownerUsername;
    private int collaboratorCount;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}