describe('Obedient Vanguard', function () {
    integration(function (contextRef) {
        describe('Obedient Vanguard\'s ability', function () {
            beforeEach(function () {
                contextRef.setupTest({
                    phase: 'action',
                    player1: {
                        groundArena: ['obedient-vanguard', 'battlefield-marine', 'wampa']
                    },
                    player2: {
                        groundArena: ['atst', 'wilderness-fighter'],
                    }
                });
            });

            it('should give +2/+2 to a trooper unit when defeated', function () {
                const { context } = contextRef;

                // obedient vanguard attack : nothing happen
                context.player1.clickCard(context.obedientVanguard);
                context.player1.clickCard(context.p2Base);
                expect(context.player2).toBeActivePlayer();

                // atst kill obedient vanguard, player1 can choose a trooper unit to give +2/+2 for this phase
                context.player2.clickCard(context.atst);
                context.player2.clickCard(context.obedientVanguard);

                expect(context.player1).toBeAbleToSelectExactly([context.battlefieldMarine, context.wildernessFighter]);
                expect(context.player1).toHavePassAbilityButton();

                context.player1.clickCard(context.battlefieldMarine);
                expect(context.battlefieldMarine.getPower()).toBe(5);
                expect(context.battlefieldMarine.getHp()).toBe(5);

                context.moveToNextActionPhase();
                expect(context.battlefieldMarine.getPower()).toBe(3);
                expect(context.battlefieldMarine.getHp()).toBe(3);
            });
        });
    });
});
