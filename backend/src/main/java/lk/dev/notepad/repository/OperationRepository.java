package lk.dev.notepad.repository;

import lk.dev.notepad.entity.Document;
import lk.dev.notepad.entity.Operation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OperationRepository extends JpaRepository<Operation, Long> {

    List<Operation> findByDocumentOrderByRevisionAsc(Document document);

    @Query("SELECT COALESCE(MAX(o.revision), 0) FROM Operation o WHERE o.document = :document")
    Long findMaxRevisionByDocument(@Param("document") Document document);

    List<Operation> findByDocumentAndRevisionGreaterThanOrderByRevisionAsc(
            Document document, Long revision
    );
}