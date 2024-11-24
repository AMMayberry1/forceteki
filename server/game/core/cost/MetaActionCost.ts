import type { AbilityContext } from '../ability/AbilityContext';
import { WildcardZoneName, RelativePlayer } from '../Constants';
import type { ICost, Result } from './ICost';
import type { GameSystem } from '../gameSystem/GameSystem';
import type { ISelectCardProperties } from '../../gameSystems/SelectCardSystem';
import { randomItem } from '../utils/Helpers';
import { GameSystemCost } from './GameSystemCost';
import { GameEvent } from '../event/GameEvent';

export class MetaActionCost<TContext extends AbilityContext = AbilityContext> extends GameSystemCost<TContext> implements ICost<TContext> {
    public constructor(
        gameSystem: GameSystem<TContext>,
        public activePromptTitle: string
    ) {
        super(gameSystem);
    }

    public override getActionName(context: TContext): string {
        const { innerSystem: gameSystem } = this.gameSystem.generatePropertiesFromContext(context) as ISelectCardProperties;
        return gameSystem.name;
    }

    public override canPay(context: TContext): boolean {
        const properties = this.gameSystem.generatePropertiesFromContext(context) as ISelectCardProperties;
        return this.gameSystem.hasLegalTarget(context);
    }

    public override queueGenerateEventGameSteps(events: GameEvent[], context: TContext, result: Result): void {
        const properties = this.gameSystem.generatePropertiesFromContext(context) as ISelectCardProperties;
        if (properties.checkTarget && context.choosingPlayerOverride) {
            context.costs[properties.innerSystem.name] = randomItem(
                properties.selector.getAllLegalTargets(context, context.player)
            );
            context.costs[properties.innerSystem.name + 'StateWhenChosen'] =
                context.costs[properties.innerSystem.name].createSnapshot();
            properties.innerSystem.queueGenerateEventGameSteps(events, context, {
                target: context.costs[properties.innerSystem.name]
            });
        }

        const additionalProps = {
            activePromptTitle: this.activePromptTitle,
            zone: properties.zoneFilter || WildcardZoneName.Any,
            controller: RelativePlayer.Self,
            cancelHandler: !result.canCancel ? null : () => (result.cancelled = true),
            subActionProperties: (target: any) => {
                context.costs[properties.innerSystem.name] = target;
                if (target.createSnapshot) {
                    context.costs[properties.innerSystem.name + 'StateWhenChosen'] = target.createSnapshot();
                }
                return properties.innerSystemProperties ? properties.innerSystemProperties(target) : {};
            }
        };
        this.gameSystem.queueGenerateEventGameSteps(events, context, additionalProps);
    }

    public hasTargetsChosenByInitiatingPlayer(context: TContext): boolean {
        return this.gameSystem.hasTargetsChosenByInitiatingPlayer(context);
    }

    public override getCostMessage(context: TContext): [string, any[]] {
        const properties = this.gameSystem.generatePropertiesFromContext(context) as ISelectCardProperties;
        return properties.innerSystem.getCostMessage(context);
    }
}
