# Arquitectura del Sistema

## 1. Diagrama Entidad-Relación (ERD) Actualizado

```mermaid
erDiagram
    TICKETS ||--o{ TICKET_HISTORIES : tiene

    TICKETS {
        int Id PK
        string Title
        string Asset
        string Description
        string Status
        string AssignedTo
        string EvidencePath
        datetime CreatedAt
        datetime UpdatedAt
    }

    TICKET_HISTORIES {
        int Id PK
        int TicketId FK
        string PreviousStatus
        string NewStatus
        string AssignedTo
        string Comment
        string EvidencePath
        datetime CreatedAt
    }
```

## 2. Diagrama de Secuencia - Flujo de Creación de Tickets y Alerta de Validación

```mermaid
sequenceDiagram
    autonumber

    actor Operador
    participant Frontend as Angular App (Kanban)
    participant API as .NET Web API
    participant DB as MySQL Database

    Operador->>Frontend: Diligencia el formulario y presiona "Crear ticket"

    alt Campos incompletos (Título o Equipo vacíos)
        Frontend-->>Operador: Muestra Modal de Alerta Centrado
    else Formulario completo
        Frontend->>API: POST /api/tickets (Title, Asset, Description)
        API->>DB: CALL sp_CreateTicket(Title, Asset, Description)
        DB-->>API: Retorna ID del nuevo Ticket
        API-->>Frontend: 201 Created (Datos del Ticket)
        Frontend-->>Operador: Agrega tarjeta a la columna PENDIENTE
    end
```

## 3. Diagrama de Secuencia - Transición de Estado (Drag & Drop, Asignación y Evidencia)

```mermaid
sequenceDiagram
    autonumber

    actor Operador
    participant Frontend as Angular App
    participant API as .NET Web API
    participant DB as MySQL Database

    Operador->>Frontend: Arrastra tarjeta a nueva columna (Drag & Drop)
    Frontend-->>Operador: Abre Modal de Cambio de Estado

    Operador->>Frontend: Selecciona encargado y escribe descripción/comentario

    alt Estado es "Resuelto" (RESOLVED)
        Operador->>Frontend: Adjunta archivo de evidencia (Foto / Documento)
    end

    Operador->>Frontend: Presiona "Guardar Cambio"

    alt Validación fallida (Falta encargado o evidencia en Resuelto)
        Frontend-->>Operador: Muestra Modal de Alerta con el error
    else Validación exitosa
        Frontend->>API: PUT /api/tickets/{id}/status (FormData: NewStatus, AssignedTo, Comment, File)
        API->>DB: CALL sp_ChangeTicketStatus(TicketId, NewStatus, AssignedTo, Comment, EvidencePath)

        alt Transacción completada en Base de Datos
            DB-->>API: Confirmación de actualización y registro en historial
            API-->>Frontend: 200 OK (Ticket actualizado)
            Frontend-->>Operador: Actualiza la columna del tablero Kanban y aplica filtros
        else Error en Base de Datos
            DB-->>API: SQL Error (Transición no válida o error interno)
            API-->>Frontend: 400 Bad Request
            Frontend-->>Operador: Muestra alerta de error
        end
    end
```

## 4. Diagrama de Componentes de la Arquitectura (Vista General)

```mermaid
graph TD
    subgraph Frontend["Angular 17 + Bootstrap + CDK"]
        UI["Header + Kanban Board"]
        Filter["Filtro por Nombre / Activo / Fechas"]
        DragDrop["Angular CDK Drag & Drop"]
        Modals["Modal de Cambio de Estado / Alerta"]
    end

    subgraph Backend[".NET 8 Web API"]
        Controller["TicketsController"]
        Service["TicketService / DTOs"]
        Upload["File Storage Service"]
    end

    subgraph Database["MySQL Server"]
        Tables[("TICKETS & TICKET_HISTORIES")]
        SP1["sp_CreateTicket"]
        SP2["sp_ChangeTicketStatus"]
    end

    UI --> Filter
    UI --> DragDrop
    DragDrop --> Modals

    Modals --> Controller
    Controller --> Service

    Service --> Upload
    Service --> SP1
    Service --> SP2

    SP1 --> Tables
    SP2 --> Tables
```