import { Component, OnInit, Input } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { Subscriber, Animations } from '@core';
import { ChatMessage } from '@models';
import { ChatService } from '@services';


@Component({
    selector: 'chat',
    templateUrl: './template.html',
    styleUrls: ['./styles.scss'],
    animations: [Animations.slideInBottom]
})
export class ChatComponent extends Subscriber implements OnInit {

    @Input('theatreId') theatreId: string;

    messages: ChatMessage[] = [];

    messageControl = new FormControl('');
    messageForm = new FormGroup({
        message: this.messageControl
    });

    constructor(
        private _chatService: ChatService
    ) {
        super();
    }

    ngOnInit() {
        this.addSubscription(
            this._chatService.observeMessages()
            .subscribe(
                msg => {
                    this.messages.unshift(msg);
                    if (this.messages.length > 50) {
                        this.messages = this.messages.slice(0, 50);
                    }
                }
            )
        );
    }

    sendMessage() {
        if (this.messageControl.value) {
            const m = this.messageControl.value.trim();
            if (m.length > 0) {
                this._chatService.sendMessage(m, this.theatreId);
            }
        }
        this.messageControl.reset();
    }
}
