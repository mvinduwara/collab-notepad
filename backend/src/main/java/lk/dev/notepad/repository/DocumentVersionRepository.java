package lk.dev.notepad.repository;

import lk.dev.notepad.entity.Document;
import lk.dev.notepad.entity.DocumentVersion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DocumentVersionRepository extends JpaRepository<DocumentVersion, Long> {

    List<DocumentVersion> findByDocumentOrderByVersionNumberDesc(Document document);

    Optional<DocumentVersion> findByDocumentAndVersionNumber(Document document, Integer versionNumber);

    @Query("SELECT COALESCE(MAX(dv.versionNumber), 0) FROM DocumentVersion dv WHERE dv.document = :document")
    Integer findMaxVersionNumberByDocument(@Param("document") Document document);

    List<DocumentVersion> findTop10ByDocumentOrderByVersionNumberDesc(Document document);
}