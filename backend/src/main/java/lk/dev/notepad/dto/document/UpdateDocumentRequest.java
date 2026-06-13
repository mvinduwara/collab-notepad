package lk.dev.notepad.dto.document;

import lk.dev.notepad.entity.Document;
import lombok.Data;

@Data
public class UpdateDocumentRequest {
    private String title;
    private String content;
    private Document.SharePermission sharePermission;
}