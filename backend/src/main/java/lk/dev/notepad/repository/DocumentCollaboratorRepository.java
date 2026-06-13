package lk.dev.notepad.repository;

import lk.dev.notepad.entity.Document;
import lk.dev.notepad.entity.DocumentCollaborator;
import lk.dev.notepad.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DocumentCollaboratorRepository extends JpaRepository<DocumentCollaborator, Long> {

    List<DocumentCollaborator> findByDocument(Document document);

    Optional<DocumentCollaborator> findByDocumentAndUser(Document document, User user);

    boolean existsByDocumentAndUser(Document document, User user);

    void deleteByDocumentAndUser(Document document, User user);

    List<DocumentCollaborator> findByUser(User user);
}