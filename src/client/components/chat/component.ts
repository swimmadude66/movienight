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

    usersHere: {username: string, userId: string}[] = [];

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
                    this._addMessage(msg);
                }
            )
        );

        this.addSubscription(
            this._chatService.observeUsers()
            .subscribe(
                userChange => {
                    this.usersHere = userChange.data.Users;
                    console.log('CurrUsers:', this.usersHere);
                    if (userChange.data.Joined) {
                        return this._addMessage({Username: 'Server', Message: `${userChange.data.Joined} joined`});
                    }
                    if (userChange.data.Left) {
                        return this._addMessage({Username: 'Server', Message: `${userChange.data.Left} left`});
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

    private _addMessage(msg: Partial<ChatMessage>) {
        this.messages.unshift(msg as ChatMessage);
        if (this.messages.length > 50) {
            this.messages = this.messages.slice(0, 50);
        }
    }
}
