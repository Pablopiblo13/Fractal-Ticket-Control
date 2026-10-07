USE fractal_maintenance;

DELIMITER //

-- SP 1: Create Ticket and initial history record
CREATE PROCEDURE sp_CreateTicket(
    IN p_Title VARCHAR(150),
    IN p_Equipment VARCHAR(50),
    IN p_Description TEXT,
    OUT p_InsertedId INT
)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    START TRANSACTION;
        INSERT INTO Tickets (Title, Equipment, Description, Status)
        VALUES (p_Title, p_Equipment, p_Description, 'PENDING');

        SET p_InsertedId = LAST_INSERT_ID();

        INSERT INTO TicketHistories (TicketId, PreviousStatus, NewStatus, Comment)
        VALUES (p_InsertedId, NULL, 'PENDING', 'Ticket created');
    COMMIT;
END //

-- SP 2: Change Ticket Status with state machine validation
CREATE PROCEDURE sp_ChangeTicketStatus(
    IN p_TicketId INT,
    IN p_NewStatus VARCHAR(20),
    IN p_Comment TEXT
)
BEGIN
    DECLARE v_CurrentStatus VARCHAR(20);

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    START TRANSACTION;
        -- Get current status with lock
        SELECT Status INTO v_CurrentStatus 
        FROM Tickets 
        WHERE Id = p_TicketId FOR UPDATE;

        IF v_CurrentStatus IS NULL THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Ticket not found';
        END IF;

        -- State Machine Validation Rules
        IF v_CurrentStatus = 'PENDING' AND p_NewStatus != 'IN_PROGRESS' THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid transition: PENDING can only move to IN_PROGRESS';
        ELSEIF v_CurrentStatus = 'IN_PROGRESS' AND p_NewStatus != 'RESOLVED' THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid transition: IN_PROGRESS can only move to RESOLVED';
        ELSEIF v_CurrentStatus = 'RESOLVED' THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid transition: RESOLVED tickets cannot change status';
        END IF;

        -- Require comment for transition to RESOLVED
        IF p_NewStatus = 'RESOLVED' AND (p_Comment IS NULL OR TRIM(p_Comment) = '') THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Comment/Diagnosis is required when resolving a ticket';
        END IF;

        -- Perform updates if validation passes
        UPDATE Tickets SET Status = p_NewStatus WHERE Id = p_TicketId;

        INSERT INTO TicketHistories (TicketId, PreviousStatus, NewStatus, Comment)
        VALUES (p_TicketId, v_CurrentStatus, p_NewStatus, p_Comment);
    COMMIT;
END //

DELIMITER ;