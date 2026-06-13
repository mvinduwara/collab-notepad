package lk.dev.notepad.dto.ws;

import lk.dev.notepad.entity.Operation;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OperationMessage {
    private Long documentId;
    private Long userId;
    private String username;
    private String color;
    private Operation.OperationType type;
    private Integer position;
    private String text;
    private Integer length;
    private Long revision;
    private Long clientId;
}