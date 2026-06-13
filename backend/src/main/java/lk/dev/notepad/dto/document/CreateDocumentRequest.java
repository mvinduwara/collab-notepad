package lk.dev.notepad.dto.document;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lk.dev.notepad.entity.Document;
import lombok.Data;

@Data
public class CreateDocumentRequest {

    @NotBlank(message = "Title is required")
    @Size(max = 200, message = "Title must not exceed 200 characters")
    private String title;

    private String content = "";

    private Document.SharePermission sharePermission = Document.SharePermission.VIEW;
}