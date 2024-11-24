describe('Self-Destruct', function () {
    integration(function (contextRef) {
        describe('Self-Destruct\'s ability', function () {
            it('should defeat a friendly unit to deal 4 damage to an enemy unit', function () {
                contextRef.setupTest({
                    phase: 'action',
                    player1: {
                        hand: ['selfdestruct'],
                        groundArena: ['pyke-sentinel'],
                        spaceArena: ['green-squadron-awing']
                    },
                    player2: {
                        groundArena: ['atst'],
                        spaceArena: ['ruthless-raider']
                    }
                });

                const { context } = contextRef;

                context.player1.clickCard(context.selfdestruct);

                // defeat a friendly unit
                expect(context.player1).toBeAbleToSelectExactly([context.pykeSentinel, context.greenSquadronAwing]);
                context.player1.clickCard(context.pykeSentinel);

                // deal 4 damage to an enemy unit
                expect(context.player1).toBeAbleToSelectExactly([context.atst, context.ruthlessRaider]);
                context.player1.clickCard(context.atst);

                expect(context.player2).toBeActivePlayer();
                expect(context.pykeSentinel).toBeInZone('discard');
                expect(context.atst.damage).toBe(4);
            });
        });
    });
});
