import { Component } from '@angular/core';
import { KanbanBoardComponent } from './components/kanban-board/kanban-board.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [KanbanBoardComponent],
  template: `<app-kanban-board></app-kanban-board>`
})
export class AppComponent {
  title = 'ticket-control-app';
}