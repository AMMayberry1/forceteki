import AbilityHelper from '../../../AbilityHelper';
import { NonLeaderUnitCard } from '../../../core/card/NonLeaderUnitCard';

export default class PunishingOne extends NonLeaderUnitCard {
    protected override getImplementationId() {
        return {
            id: '8687233791',
            internalName: 'punishing-one#dengars-jumpmaster',
        };
    }


    public override setupCardAbilities() {
        this.addTriggeredAbility({
            title: 'Ready this unit',
            when: {
                onCardDefeated: (event, context) =>
                    event.card.isUnit() &&
                    event.card.isInPlay() &&
                    event.card.isUpgraded() &&
                    event.card.controller !== context.source.controller,
            },
            optional: true,
            immediateEffect: AbilityHelper.immediateEffects.ready(),
            limit: AbilityHelper.limit.perRound(1)
        });
    }
}

PunishingOne.implemented = true;
