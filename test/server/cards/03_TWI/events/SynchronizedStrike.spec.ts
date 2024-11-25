describe('Synchronized Strike', function () {
    integration(function (contextRef) {
        describe('SynchronizedStrike\'s ability', function () {
            beforeEach(function () {
                contextRef.setupTest({
                    phase: 'action',
                    player1: {
                        hand: ['synchronized-strike'],
                        groundArena: ['battlefield-marine', 'wampa'],
                        spaceArena: ['red-three#unstoppable']
                    },
                    player2: {
                        groundArena: ['atst'],
                        spaceArena: ['green-squadron-awing']
                    }
                });
            });

            it('should allow the player to deal damage to an enemy unit equal to the number of units your control in its arena.', function () {
                const { context } = contextRef;

                context.player1.clickCard(context.synchronizedStrike);

                // select enemy unit
                expect(context.player1).toBeAbleToSelectExactly([context.atst, context.greenSquadronAwing]);
                expect(context.player1).not.toHavePassAbilityButton();
                context.player1.clickCard(context.atst);

                // deal damage equal to the number of unit in its arena
                expect(context.atst.damage).toBe(2);
                expect(context.player2).toBeActivePlayer();

                context.player1.moveCard(context.synchronizedStrike, 'hand');
                context.player2.passAction();

                // select space enemy unit
                context.player1.clickCard(context.synchronizedStrike);
                context.player1.clickCard(context.greenSquadronAwing);

                // deal damage equal to the number of unit in its arena
                expect(context.greenSquadronAwing.damage).toBe(1);
                expect(context.player2).toBeActivePlayer();
            });
        });
    });
});
