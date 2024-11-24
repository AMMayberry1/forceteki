describe('Koska Reeves', function() {
    integration(function(contextRef) {
        describe('Koska Reeves\'s ability', function() {
            beforeEach(function () {
                contextRef.setupTest({
                    phase: 'action',
                    player1: {
                        hand: ['academy-training'],
                        groundArena: ['koska-reeves#loyal-nite-owl'],
                        spaceArena: ['green-squadron-awing']
                    },
                    player2: {
                        groundArena: ['wampa'],
                    }
                });
            });

            it('should deal 2 damage to a friendly unit when upgraded', function () {
                const { context } = contextRef;

                // attack base, koska is not upgraded, she cannot deal extra damage to ground unit
                context.player1.clickCard(context.koskaReeves);
                context.player1.clickCard(context.p2Base);
                expect(context.player2).toBeActivePlayer();
                expect(context.wampa.damage).toBe(0);
                context.koskaReeves.exhausted = false;
                context.player2.passAction();

                // upgrade koska
                context.player1.clickCard(context.academyTraining);
                context.player1.clickCard(context.koskaReeves);
                context.player2.passAction();
                context.player1.clickCard(context.koskaReeves);
                context.player1.clickCard(context.p2Base);

                // koska should be able to select ground unit to deal extra damage
                expect(context.player1).toBeAbleToSelectExactly([context.koskaReeves, context.wampa]);
                expect(context.player1).toHavePassAbilityButton();
                context.player1.clickCard(context.wampa);
                expect(context.wampa.damage).toBe(2);
                expect(context.player2).toBeActivePlayer();
            });
        });
    });
});
