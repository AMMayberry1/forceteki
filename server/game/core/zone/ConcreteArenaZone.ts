import { InPlayCard } from '../card/baseClasses/InPlayCard';
import { Card } from '../card/Card';
import { ZoneName } from '../Constants';
import Game from '../Game';
import Player from '../Player';
import * as Contract from '../utils/Contract';
import { ConcreteOrMetaArenaZone, IArenaZoneCardFilterProperties } from './ConcreteOrMetaArenaZone';
import { IAddRemoveZone } from './ZoneAbstract';

/**
 * Base class for the "concrete" arena zones - ground and space - which are not the meta-zone AllArenasZone
 */
export abstract class ConcreteArenaZone extends ConcreteOrMetaArenaZone implements IAddRemoveZone {
    public override readonly hiddenForPlayers: null;
    public abstract override readonly name: ZoneName;
    public override readonly owner: Game;

    protected _cards = new Map<Player, InPlayCard[]>();

    public override get cards(): InPlayCard[] {
        return Array.from(this._cards.values()).flat();
    }

    public override get count() {
        let cardCount = 0;
        this._cards.forEach((cards) => cardCount += cards.length);
        return cardCount;
    }

    public constructor(owner: Game, player1: Player, player2: Player) {
        super(owner);

        this._cards.set(player1, []);
        this._cards.set(player2, []);
    }

    public override getCards(filter?: IArenaZoneCardFilterProperties): InPlayCard[] {
        const filterFn = this.buildFilterFn(filter);

        let cards: InPlayCard[] = [];

        for (const [player, playerCards] of this._cards) {
            if (!filter?.controller || filter.controller === player) {
                cards = cards.concat(playerCards.filter(filterFn));
            }
        }

        return cards;
    }

    public addCard(card: InPlayCard) {
        const controller = card.controller;
        const cardListForController = this._cards.get(controller);

        Contract.assertHasKey(this._cards, controller, `Attempting to add card ${card.internalName} to ${this} but the controller ${controller} is not registered`);
        Contract.assertFalse(this._cards.get(controller.opponent).includes(card), `Attempting to add card ${card.internalName} for ${controller} to ${this} but it is already in the arena for the opponent`);
        Contract.assertFalse(cardListForController.includes(card), `Attempting to add card ${card.internalName} for ${controller} to ${this} twice`);

        cardListForController.push(card);
    }

    public removeCard(card: Card) {
        Contract.assertTrue(card.canBeInPlay());

        const controller = card.controller;
        const cardListForController = this._cards.get(controller);
        const cardIdx = cardListForController.indexOf(card);

        Contract.assertHasKey(this._cards, controller, `Attempting to add card ${card.internalName} to ${this} but the controller ${controller} is not registered`);
        Contract.assertFalse(this._cards.get(controller.opponent).includes(card), `Attempting to remove card ${card.internalName} for controller ${controller} from ${this} but it is in the arena for the opponent`);
        Contract.assertFalse(cardIdx === -1, `Attempting to remove card ${card.internalName} for ${controller} from ${this} but it does not exist`);

        cardListForController.splice(cardIdx, 1);
    }

    public updateController(card: Card) {
        Contract.assertTrue(card.canBeInPlay());

        const controllerCardsList = this._cards.get(card.controller);

        // card is already in its controller's list, nothing to do
        if (controllerCardsList.includes(card)) {
            return;
        }

        const opponentCardsList = this._cards.get(card.controller.opponent);
        const removeCardIdx = opponentCardsList.indexOf(card);

        Contract.assertTrue(removeCardIdx !== -1, `Attempting to update controller of card ${card.internalName} to ${card.controller} in ${this} but it is not in the arena`);

        opponentCardsList.splice(removeCardIdx, 1);
        controllerCardsList.push(card);
    }
}
