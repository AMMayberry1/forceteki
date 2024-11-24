import Player from '../Player';
import { WithCost } from './propertyMixins/Cost';
import { CardType, KeywordName, ZoneName, PlayType } from '../Constants';
import * as Contract from '../utils/Contract';
import { IDecreaseEventCostAbilityProps, PlayableOrDeployableCard } from './baseClasses/PlayableOrDeployableCard';
import { IEventAbilityProps } from '../../Interfaces';
import { EventAbility } from '../ability/EventAbility';
import { PlayEventAction } from '../../actions/PlayEventAction';
import { WithStandardAbilitySetup } from './propertyMixins/StandardAbilitySetup';
import AbilityHelper from '../../AbilityHelper';
import PlayerOrCardAbility from '../ability/PlayerOrCardAbility';
import { TokenOrPlayableCard } from './CardTypes';

const EventCardParent = WithCost(WithStandardAbilitySetup(PlayableOrDeployableCard));

export class EventCard extends EventCardParent {
    private _eventAbility: EventAbility;

    public constructor(owner: Player, cardData: any) {
        super(owner, cardData);
        Contract.assertEqual(this.printedType, CardType.Event);

        this.defaultActions.push(new PlayEventAction({ card: this }));

        Contract.assertNotNullLike(this._eventAbility, 'Event card\'s ability was not initialized');

        // currently the only constant abilities an event card can have are those that reduce cost, which are always active regardless of zone
        for (const constantAbility of this.constantAbilities) {
            constantAbility.registeredEffects = this.addEffectToEngine(constantAbility);
        }
    }

    public override isEvent(): this is EventCard {
        return true;
    }

    public override getActions(): PlayerOrCardAbility[] {
        const actions = super.getActions();

        if (this.zoneName === ZoneName.Resource && this.hasSomeKeyword(KeywordName.Smuggle)) {
            actions.push(new PlayEventAction({ card: this, playType: PlayType.Smuggle }));
        }
        return actions;
    }

    public override isTokenOrPlayable(): this is TokenOrPlayableCard {
        return true;
    }

    /** Ability of event card when played. Will be a "blank" ability with no effect if this card is disabled by an effect. */
    public getEventAbility(): EventAbility {
        return this.isBlank()
            ? new EventAbility(this._eventAbility.game, this._eventAbility.card, { title: 'No effect', printedAbility: false, immediateEffect: AbilityHelper.immediateEffects.noAction({ hasLegalTarget: true }) })
            : this._eventAbility;
    }

    protected override initializeForCurrentZone(prevZone?: ZoneName): void {
        super.initializeForCurrentZone(prevZone);

        // event cards can only be exhausted when resourced
        switch (this.zoneName) {
            case ZoneName.Resource:
                this.setExhaustEnabled(true);
                break;

            default:
                this.setExhaustEnabled(false);
                break;
        }
    }

    protected setEventAbility(properties: IEventAbilityProps) {
        properties.cardName = this.title;
        this._eventAbility = new EventAbility(this.game, this, properties);
    }


    /** Add a constant ability on the card that decreases its cost under the given condition */
    protected addDecreaseCostAbility(properties: IDecreaseEventCostAbilityProps<this>): void {
        this.constantAbilities.push(this.createConstantAbility(this.generateDecreaseCostAbilityProps(properties)));
    }
}
