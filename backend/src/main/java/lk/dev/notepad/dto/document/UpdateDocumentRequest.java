package com.collabpad.dto.document;

import com.collabpad.entity.Document;
import lombok.Data;

@Data
public class UpdateDocumentRequest {
    private String title;
    private String content;
    private Document.SharePermission sharePermission;
}