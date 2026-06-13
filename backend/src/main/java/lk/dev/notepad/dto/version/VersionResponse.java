package lk.dev.notepad.dto.version;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VersionResponse {
    private Long id;
    private Integer versionNumber;
    private String content;
    private String savedByUsername;
    private LocalDateTime createdAt;
}