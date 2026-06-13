package lk.dev.notepad.service;

import lk.dev.notepad.dto.version.VersionResponse;
import lk.dev.notepad.entity.Document;
import lk.dev.notepad.entity.DocumentVersion;
import lk.dev.notepad.repository.DocumentRepository;
import lk.dev.notepad.repository.DocumentVersionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class VersionService {

    private final DocumentVersionRepository versionRepository;
    private final DocumentRepository documentRepository;

    @Transactional(readOnly = true)
    public List<VersionResponse> getVersions(Long documentId) {
        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new RuntimeException("Document not found"));

        return versionRepository.findTop10ByDocumentOrderByVersionNumberDesc(document)
                .stream()
                .map(this::toVersionResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public VersionResponse getVersion(Long documentId, Integer versionNumber) {
        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new RuntimeException("Document not found"));

        DocumentVersion version = versionRepository
                .findByDocumentAndVersionNumber(document, versionNumber)
                .orElseThrow(() -> new RuntimeException("Version not found"));

        return toVersionResponse(version);
    }

    private VersionResponse toVersionResponse(DocumentVersion version) {
        return VersionResponse.builder()
                .id(version.getId())
                .versionNumber(version.getVersionNumber())
                .content(version.getContent())
                .savedByUsername(version.getSavedBy().getUsername())
                .createdAt(version.getCreatedAt())
                .build();
    }
}