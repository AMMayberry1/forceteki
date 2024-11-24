describe('Freelance Assassin', function () {
    integration(function (contextRef) {
        describe('Freelance Assassin\'s ability', function () {
            it('should pay 2 resources to deal 2 damage to a unit', function () {
                contextRef.setupTest({
                    phase: 'action',
                    player1: {
                        hand: ['freelance-assassin'],
                        spaceArena: ['restored-arc170'],
                        leader: 'lando-calrissian#with-impeccable-taste'
                    },
                    player2: {
                        groundArena: ['battlefield-marine']
                    }
                });

                const { context } = contextRef;

                context.player1.clickCard(context.freelanceAssassin);

                // have a prompt to pay 2 resources
                expect(context.player1).toHavePassAbilityPrompt('Pay 2 resources. If you do, deal 2 damage to a unit.');
                context.player1.clickPrompt('Pay 2 resources. If you do, deal 2 damage to a unit.');

                // deal 2 damage to a unit
                expect(context.player1).toBeAbleToSelectExactly([context.freelanceAssassin, context.restoredArc170, context.battlefieldMarine]);
                context.player1.clickCard(context.battlefieldMarine);

                expect(context.player2).toBeActivePlayer();
                expect(context.battlefieldMarine.damage).toBe(2);
                expect(context.player1.exhaustedResourceCount).toBe(5);
            });
        });
    });
});
