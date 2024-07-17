const AbilityLimit = require('./AbilityLimit');
const AbilityDsl = require('./abilitydsl');
const ThenAbility = require('./ThenAbility');
const Costs = require('./Costs.js');
const { Locations, CardTypes, EffectNames, Players } = require('./Constants');
import { InitiateAttack } from "../Interfaces";

export const initiateAttack = (game, card, properties) => {
    if (properties.initiateAttack) {
        if (card.type === CardTypes.Unit) {
            initiateAttackFromUnit(game, card, properties);
        } else {
            initiateAttackFromOther(game, card, properties);
        }
    }
}

const checkAttackerCondition = (card, context, properties) => {
    const attackerCondition = getProperty(properties, context, 'attackerCondition');

    return attackerCondition ? attackerCondition(card, context) : true;
}

const initiateAttackFromUnit = (game, card, properties) => {
    let prevCondition = properties.condition;
    properties.condition = (context) => {
        const abilityCondition = (!prevCondition || prevCondition(context));
        const attackerCondition = checkAttackerCondition(card, context, properties);
        return abilityCondition && attackerCondition;
    }
    properties.target = {
        ...getBaselineAttackTargetProperties(card, properties),
        gameAction: AbilityDsl.actions.duel((context) => {
            const attackProperties = getProperty(properties, context);
            return Object.assign({ attacker: context.source }, attackProperties);
        })
    };
}

const initiateAttackFromOther = (game, card, properties) => {
    properties.targets = {
        attacker: {
            cardType: CardTypes.Character,
            player: (context) => {
                const opponentChoosesAttacker = getProperty(properties, context, 'opponentChoosesAttacker');
                return opponentChoosesAttacker ? Players.Opponent : Players.Self;
            },
            controller: Players.Self,
            cardCondition: (card, context) => checkAttackerCondition(card, context, properties)
        },
        duelTarget: {
            dependsOn: 'attacker',
            ...getBaselineAttackTargetProperties(undefined, properties),
            gameAction: AbilityDsl.actions.duel((context) => {
                const attackProperties = getProperty(properties, context);
                return Object.assign({ attacker: context.targets.attacker }, attackProperties);
            })
        }
    };
}

const getBaselineAttackTargetProperties = (attacker, properties) => {
    const props = {
        cardType: CardTypes.Unit,
        player: (context) => {
            const opponentChoosesAttackTarget = getProperty(properties, context, 'opponentChoosesAttackTarget');
            return opponentChoosesAttackTarget ? Players.Opponent : Players.Self;
        },
        controller: Players.Opponent,
        cardCondition: (card, context) => {
            const attackerCard = attacker ?? context.targets.attacker;

            if (attackerCard === card) {
                return false;
            }
            const targetCondition = getProperty(properties, context, 'targetCondition');
            // default target condition
            return targetCondition ? targetCondition(card, context) : null;
        },        
    };
    return props;
}

const getProperty = (properties, context, propName?) => {
    let attackProperties: InitiateAttack;

    if (typeof properties.initiateAttack === 'function') {
        attackProperties = properties.initiateAttack(context);
    } else {
        attackProperties = properties.initiateAttack;
    }

    // default values
    attackProperties = {
        ...attackProperties
    }

    if (!propName) {
        return attackProperties;
    }

    return attackProperties?.[propName];
}