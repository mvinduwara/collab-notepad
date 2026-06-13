package lk.dev.notepad .service;

import lk.dev.notepad.dto.ws.OperationMessage;
import lk.dev.notepad.entity.Operation;
import org.springframework.stereotype.Service;

@Service
public class OperationalTransformService {

    public OperationMessage transform(OperationMessage incoming, OperationMessage concurrent) {
        if (concurrent == null) return incoming;

        Operation.OperationType inType = incoming.getType();
        Operation.OperationType conType = concurrent.getType();

        if (inType == Operation.OperationType.INSERT
                && conType == Operation.OperationType.INSERT) {
            return transformInsertInsert(incoming, concurrent);
        }

        if (inType == Operation.OperationType.INSERT
                && conType == Operation.OperationType.DELETE) {
            return transformInsertDelete(incoming, concurrent);
        }

        if (inType == Operation.OperationType.DELETE
                && conType == Operation.OperationType.INSERT) {
            return transformDeleteInsert(incoming, concurrent);
        }

        if (inType == Operation.OperationType.DELETE
                && conType == Operation.OperationType.DELETE) {
            return transformDeleteDelete(incoming, concurrent);
        }

        return incoming;
    }

    private OperationMessage transformInsertInsert(OperationMessage op, OperationMessage concurrent) {
        OperationMessage result = copyOf(op);
        if (op.getPosition() > concurrent.getPosition()) {
            result.setPosition(op.getPosition() + textLength(concurrent));
        } else if (op.getPosition().equals(concurrent.getPosition())) {
            if (op.getUserId() > concurrent.getUserId()) {
                result.setPosition(op.getPosition() + textLength(concurrent));
            }
        }
        return result;
    }

    private OperationMessage transformInsertDelete(OperationMessage op, OperationMessage concurrent) {
        OperationMessage result = copyOf(op);
        int opPos = op.getPosition();
        int conPos = concurrent.getPosition();
        int conLen = concurrent.getLength();

        if (opPos > conPos + conLen) {
            result.setPosition(opPos - conLen);
        } else if (opPos > conPos) {
            result.setPosition(conPos);
        }
        return result;
    }

    private OperationMessage transformDeleteInsert(OperationMessage op, OperationMessage concurrent) {
        OperationMessage result = copyOf(op);
        int opPos = op.getPosition();
        int conPos = concurrent.getPosition();

        if (opPos >= conPos) {
            result.setPosition(opPos + textLength(concurrent));
        }
        return result;
    }

    private OperationMessage transformDeleteDelete(OperationMessage op, OperationMessage concurrent) {
        OperationMessage result = copyOf(op);
        int opPos = op.getPosition();
        int opLen = op.getLength();
        int conPos = concurrent.getPosition();
        int conLen = concurrent.getLength();

        if (opPos > conPos + conLen) {
            result.setPosition(opPos - conLen);
        } else if (opPos >= conPos) {
            int overlapStart = Math.max(opPos, conPos);
            int overlapEnd = Math.min(opPos + opLen, conPos + conLen);
            int overlap = Math.max(0, overlapEnd - overlapStart);
            result.setPosition(conPos);
            result.setLength(opLen - overlap);
        } else {
            int overlapStart = Math.max(opPos, conPos);
            int overlapEnd = Math.min(opPos + opLen, conPos + conLen);
            int overlap = Math.max(0, overlapEnd - overlapStart);
            result.setLength(opLen - overlap);
        }

        return result;
    }

    private int textLength(OperationMessage op) {
        if (op.getText() == null) return 0;
        return op.getText().length();
    }

    private OperationMessage copyOf(OperationMessage op) {
        return OperationMessage.builder()
                .documentId(op.getDocumentId())
                .userId(op.getUserId())
                .username(op.getUsername())
                .color(op.getColor())
                .type(op.getType())
                .position(op.getPosition())
                .text(op.getText())
                .length(op.getLength())
                .revision(op.getRevision())
                .clientId(op.getClientId())
                .build();
    }

    public String applyOperation(String content, OperationMessage op) {
        if (content == null) content = "";

        switch (op.getType()) {
            case INSERT -> {
                int pos = Math.min(op.getPosition(), content.length());
                return content.substring(0, pos) + op.getText() + content.substring(pos);
            }
            case DELETE -> {
                int pos = Math.min(op.getPosition(), content.length());
                int end = Math.min(pos + op.getLength(), content.length());
                return content.substring(0, pos) + content.substring(end);
            }
            default -> {
                return content;
            }
        }
    }
}