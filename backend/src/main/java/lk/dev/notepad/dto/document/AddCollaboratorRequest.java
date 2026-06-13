package lk.dev.notepad.dto.document;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lk.dev.notepad.entity.DocumentCollaborator;
import lombok.Data;

@Data
public class AddCollaboratorRequest {

    @NotBlank(message = "Username or email is required")
    private String usernameOrEmail;

    @NotNull(message = "Permission is required")
    private DocumentCollaborator.Permission permission;
}