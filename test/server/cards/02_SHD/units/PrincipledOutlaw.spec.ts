describe('Principled Outlaw', function() {
    integration(function(contextRef) {
        describe('Principled Outlaw\'s exhaust ability', function() {
            beforeEach(function () {
                contextRef.setupTest({
                    phase: 'action',
                    player1: {
                        groundArena: ['principled-outlaw', 'battlefield-marine']
                    },
                    player2: {
                        groundArena: ['wampa'],
                        spaceArena: ['cartel-spacer'],
                        leader: { card: 'grand-moff-tarkin#oversector-governor', deployed: true }
                    }
                });
            });

            it('allows the player to exhaust any ground unit', function () {
                const { context } = contextRef;

                // Attack with Principled Outlaw
                context.player1.clickCard(context.principledOutlaw);
                context.player1.clickCard(context.p2Base);

                expect(context.player1).toBeAbleToSelectExactly([context.principledOutlaw, context.wampa, context.grandMoffTarkin, context.battlefieldMarine]);
                expect(context.player1).toHavePassAbilityButton();
                context.player1.clickCard(context.wampa);
                expect(context.wampa.exhausted).toBeTrue();
            });
        });
    });
});
