describe('Kintan Intimidator', function () {
    integration(function (contextRef) {
        describe('Kintan Intimidator\'s ability', function () {
            beforeEach(function () {
                contextRef.setupTest({
                    phase: 'action',
                    player1: {
                        groundArena: ['kintan-intimidator']
                    },
                    player2: {
                        groundArena: ['battlefield-marine']
                    }
                });
            });

            it('should exhaust the defender when attacking a unit', function () {
                const { context } = contextRef;

                // When Kintan Intimidator attacks the enemy base, nothing gets exhausted
                context.player1.clickCard(context.kintanIntimidator);
                context.player1.clickCard(context.p2Base);
                expect(context.player2).toBeActivePlayer();
                expect(context.battlefieldMarine.exhausted).toBe(false);
                context.player2.passAction();


                // Select Kintan Intimidator and attack the Marine, then Marine gets exhausted
                context.kintanIntimidator.exhausted = false;
                context.player1.clickCard(context.kintanIntimidator);
                context.player1.clickCard(context.battlefieldMarine);
                expect(context.battlefieldMarine.exhausted).toBeTrue();
                expect(context.player2).toBeActivePlayer();
            });
        });
    });
});
