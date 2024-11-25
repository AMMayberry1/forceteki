describe('Ziro the Hutt, Colorful Schemer', function () {
    integration(function (contextRef) {
        describe('Ziro the Hutt\'s ability', function () {
            it('should exhaust an enemy unit when played and an enemy resource on attack', function () {
                contextRef.setupTest({
                    phase: 'action',
                    player1: {
                        hand: ['ziro-the-hutt#colorful-schemer'],
                        groundArena: ['atst'],
                    },
                    player2: {
                        groundArena: ['battlefield-marine'],
                        spaceArena: ['green-squadron-awing']
                    }
                });

                const { context } = contextRef;

                context.player1.clickCard(context.ziroTheHutt);

                // should exhaust an enemy unit
                expect(context.player1).toBeAbleToSelectExactly([context.battlefieldMarine, context.greenSquadronAwing]);
                expect(context.player1).toHavePassAbilityButton();

                context.player1.clickCard(context.battlefieldMarine);
                expect(context.battlefieldMarine.exhausted).toBeTrue();

                context.ziroTheHutt.exhausted = false;
                context.player2.passAction();

                context.player1.clickCard(context.ziroTheHutt);
                context.player1.clickCard(context.p2Base);

                // should exhaust an enemy resource
                expect(context.player1).toHavePassAbilityPrompt('Exhaust an enemy resource');
                context.player1.clickPrompt('Exhaust an enemy resource');

                expect(context.player2.exhaustedResourceCount).toBe(1);
                expect(context.player2).toBeActivePlayer();
            });
        });
    });
});
