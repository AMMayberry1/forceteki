import type { AbilityContext } from '../core/ability/AbilityContext';
import type { Card } from '../core/card/Card';
import { EventName, WildcardCardType, ZoneName } from '../core/Constants';
import { CardTargetSystem, type ICardTargetSystemProperties } from '../core/gameSystem/CardTargetSystem';
import * as Contract from '../core/utils/Contract';
import { DamageSourceType, DefeatSourceType, IDamageSource, IDefeatSource } from '../IDamageOrDefeatSource';

export interface IDefeatCardPropertiesBase extends ICardTargetSystemProperties {
    defeatSource?: IDamageSource | DefeatSourceType.Ability | DefeatSourceType.UniqueRule | DefeatSourceType.FrameworkEffect;
}

export interface IDefeatCardProperties extends IDefeatCardPropertiesBase {

    /**
     * Identifies the type of effect that triggered the defeat. If the defeat was caused by damage,
     * just pass in the damage source metadata. Otherwise, the defeat is due to an ability (default).
     */
    defeatSource?: IDamageSource | DefeatSourceType.Ability;
}

export class DefeatCardSystem<TContext extends AbilityContext = AbilityContext, TProperties extends IDefeatCardPropertiesBase = IDefeatCardProperties> extends CardTargetSystem<TContext, TProperties> {
    public override readonly name = 'defeat';
    public override readonly eventName = EventName.OnCardDefeated;
    public override readonly costDescription = 'defeating {0}';
    protected override readonly targetTypeFilter = [WildcardCardType.Unit, WildcardCardType.Upgrade];

    protected override readonly defaultProperties: IDefeatCardProperties = {
        defeatSource: DefeatSourceType.Ability
    };

    public eventHandler(event): void {
        if (event.card.zoneName !== ZoneName.Resource && event.card.isUpgrade()) {
            event.card.unattach();
        }

        if (event.card.isToken()) {
            // move the token out of the play area so that effect cleanup happens, then remove it from all card lists
            event.card.moveTo(ZoneName.OutsideTheGame);
        } else if (event.card.isLeader()) {
            event.card.undeploy();
        } else {
            event.card.moveTo(ZoneName.Discard);
        }
    }

    public override getEffectMessage(context: TContext): [string, any[]] {
        const properties = this.generatePropertiesFromContext(context);
        return ['defeat {0}', [properties.target]];
    }

    public override canAffect(card: Card, context: TContext): boolean {
        if (card.zoneName !== ZoneName.Resource && (!card.canBeInPlay() || !card.isInPlay())) {
            return false;
        }
        return super.canAffect(card, context);
    }

    protected override addPropertiesToEvent(event: any, card: Card, context: TContext, additionalProperties?: any): void {
        super.addPropertiesToEvent(event, card, context, additionalProperties);
        this.addDefeatSourceToEvent(event, card, context);
    }

    /** Generates metadata indicating what the source of the defeat is for relevant effects such as "when [X] attacks and defeats..." */
    private addDefeatSourceToEvent(event: any, card: Card, context: TContext) {
        // if this defeat is caused by damage, just use the same source as the damage event
        const { defeatSource } = this.generatePropertiesFromContext(context);

        let eventDefeatSource: IDefeatSource;

        event.isDefeatedByAttackerDamage = false;
        if (typeof defeatSource === 'object') {
            eventDefeatSource = defeatSource;

            event.isDefeatedByAttackerDamage =
                eventDefeatSource.type === DamageSourceType.Attack &&
                eventDefeatSource.damageDealtBy === eventDefeatSource.attack.attacker;
        } else {
            eventDefeatSource = this.buildDefeatSourceForType(defeatSource, event, context);
        }

        event.defeatSource = eventDefeatSource;
    }

    protected buildDefeatSourceForType(defeatSourceType: DefeatSourceType, event: any, context: TContext): IDefeatSource | null {
        Contract.assertEqual(defeatSourceType, DefeatSourceType.Ability);

        // TODO: confirm that this works when the player controlling the ability is different than the player controlling the card (e.g., bounty)
        return {
            type: DamageSourceType.Ability,
            player: context.player,
            card: context.source,
            event
        };
    }

    protected override updateEvent(event, card: Card, context: TContext, additionalProperties): void {
        // TODO maybe refactor addLeavesPlayPropertiesToEvent without calling super.updateEvent()
        if (card.zoneName !== ZoneName.Resource) {
            this.addLeavesPlayPropertiesToEvent(event, card, context, additionalProperties);
        } else {
            super.updateEvent(event, card, context, additionalProperties);
        }
    }
}
