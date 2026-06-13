package lk.dev.notepad.controller;

import jakarta.validation.Valid;
import lk.dev.notepad.dto.document.*;
import lk.dev.notepad.dto.version.VersionResponse;
import lk.dev.notepad.entity.User;
import lk.dev.notepad.security.AuthHelper;
import lk.dev.notepad.service.DocumentService;
import lk.dev.notepad.service.VersionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/documents")
@RequiredArgsConstructor
public class DocumentController {

    private final DocumentService documentService;
    private final VersionService versionService;
    private final AuthHelper authHelper;

    @PostMapping
    public ResponseEntity<DocumentResponse> createDocument(
            @Valid @RequestBody CreateDocumentRequest request) {
        User user = authHelper.getCurrentUser();
        return ResponseEntity.ok(documentService.createDocument(request, user));
    }

    @GetMapping
    public ResponseEntity<List<DocumentSummaryResponse>> getMyDocuments() {
        User user = authHelper.getCurrentUser();
        return ResponseEntity.ok(documentService.getMyDocuments(user));
    }

    @GetMapping("/{id}")
    public ResponseEntity<DocumentResponse> getDocument(@PathVariable Long id) {
        User user = authHelper.getCurrentUser();
        return ResponseEntity.ok(documentService.getDocument(id, user));
    }

    @PutMapping("/{id}")
    public ResponseEntity<DocumentResponse> updateDocument(
            @PathVariable Long id,
            @RequestBody UpdateDocumentRequest request) {
        User user = authHelper.getCurrentUser();
        return ResponseEntity.ok(documentService.updateDocument(id, request, user));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteDocument(@PathVariable Long id) {
        User user = authHelper.getCurrentUser();
        documentService.deleteDocument(id, user);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/collaborators")
    public ResponseEntity<DocumentResponse> addCollaborator(
            @PathVariable Long id,
            @Valid @RequestBody AddCollaboratorRequest request) {
        User user = authHelper.getCurrentUser();
        return ResponseEntity.ok(documentService.addCollaborator(id, request, user));
    }

    @DeleteMapping("/{id}/collaborators/{userId}")
    public ResponseEntity<Void> removeCollaborator(
            @PathVariable Long id,
            @PathVariable Long userId) {
        User user = authHelper.getCurrentUser();
        documentService.removeCollaborator(id, userId, user);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/share/{token}")
    public ResponseEntity<DocumentResponse> getByShareToken(@PathVariable String token) {
        User user = null;
        try {
            user = authHelper.getCurrentUser();
        } catch (Exception ignored) {}
        return ResponseEntity.ok(documentService.getDocumentByShareToken(token, user));
    }

    @PostMapping("/{id}/versions")
    public ResponseEntity<Void> saveVersion(@PathVariable Long id) {
        User user = authHelper.getCurrentUser();
        documentService.saveVersion(id, user);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/versions/{versionNumber}/restore")
    public ResponseEntity<DocumentResponse> restoreVersion(
            @PathVariable Long id,
            @PathVariable Integer versionNumber) {
        User user = authHelper.getCurrentUser();
        return ResponseEntity.ok(documentService.restoreVersion(id, versionNumber, user));
    }

    @GetMapping("/{id}/versions")
    public ResponseEntity<List<VersionResponse>> getVersions(@PathVariable Long id) {
        return ResponseEntity.ok(versionService.getVersions(id));
    }

    @GetMapping("/{id}/versions/{versionNumber}")
    public ResponseEntity<VersionResponse> getVersion(
            @PathVariable Long id,
            @PathVariable Integer versionNumber) {
        return ResponseEntity.ok(versionService.getVersion(id, versionNumber));
    }
}