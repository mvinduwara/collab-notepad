package lk.dev.notepad.dto.ws;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CursorMessage {
    private Long documentId;
    private Long userId;
    private String username;
    private String color;
    private Integer position;
    private Integer selectionStart;
    private Integer selectionEnd;
}