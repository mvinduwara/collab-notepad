package lk.dev.notepad.repository;

import lk.dev.notepad.entity.Document;
import lk.dev.notepad.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DocumentRepository extends JpaRepository<Document, Long> {

    List<Document> findByOwnerOrderByUpdatedAtDesc(User owner);

    Optional<Document> findByShareToken(String shareToken);

    @Query("""
        SELECT d FROM Document d
        WHERE d.owner = :user
        OR EXISTS (
            SELECT dc FROM DocumentCollaborator dc
            WHERE dc.document = d AND dc.user = :user
        )
        ORDER BY d.updatedAt DESC
    """)
    List<Document> findAllAccessibleByUser(@Param("user") User user);

    @Query("""
        SELECT d FROM Document d
        JOIN DocumentCollaborator dc ON dc.document = d
        WHERE dc.user = :user
        ORDER BY d.updatedAt DESC
    """)
    List<Document> findSharedWithUser(@Param("user") User user);

    boolean existsByIdAndOwner(Long id, User owner);
}