describe('Outflank', function () {
    integration(function (contextRef) {
        describe('Outflank\'s ability', function () {
            it('should initiate 2 attacks', function () {
                contextRef.setupTest({
                    phase: 'action',
                    player1: {
                        hand: ['outflank'],
                        groundArena: ['pyke-sentinel', 'battlefield-marine']
                    },
                    player2: {
                        groundArena: ['wampa']
                    }
                });

                const { context } = contextRef;

                context.player1.clickCard(context.outflank);
                expect(context.player1).toBeAbleToSelectExactly([context.pykeSentinel, context.battlefieldMarine]);

                context.player1.clickCard(context.pykeSentinel);
                context.player1.clickCard(context.wampa);

                // First attack from Pyke Sentinel
                expect(context.wampa.damage).toBe(2);

                // Second attack resolved automatically, select target only
                context.player1.clickCard(context.wampa);

                expect(context.player2).toBeActivePlayer();
            });

            it('should initiate 1 attack if there is not another unit', function () {
                contextRef.setupTest({
                    phase: 'action',
                    player1: {
                        hand: ['outflank'],
                        groundArena: ['pyke-sentinel']
                    }
                });

                const { context } = contextRef;

                context.player1.clickCard(context.outflank);

                expect(context.pykeSentinel.exhausted).toBe(true);
                expect(context.p2Base.damage).toBe(2);
                expect(context.player2).toBeActivePlayer();
            });
        });
    });
});
