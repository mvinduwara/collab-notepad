package lk.dev.notepad.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "operations")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Operation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "document_id", nullable = false)
    private Document document;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private OperationType type;

    @Column(nullable = false)
    private Integer position;

    @Column(columnDefinition = "TEXT")
    private String text;

    @Column(nullable = false)
    private Integer length;

    @Column(nullable = false)
    private Long revision;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    public enum OperationType {
        INSERT, DELETE, RETAIN
    }
}