describe('Palpatine\'s Return', function() {
    integration(function(contextRef) {
        describe('Palpatine\'s Return\'s ability', function() {
            beforeEach(function () {
                contextRef.setupTest({
                    phase: 'action',
                    player1: {
                        base: 'administrators-tower',
                        leader: 'grand-moff-tarkin#oversector-governor',
                        hand: ['palpatines-return'],
                        discard: ['supreme-leader-snoke#shadow-ruler', 'avenger#hunting-star-destroyer', 'waylay', 'foundling'],
                        resources: 25
                    },
                    player2: {
                        discard: ['wampa']
                    }
                });
            });

            it('allows to play a unit from the discard', function () {
                const { context } = contextRef;
                const reset = () => {
                    context.player1.moveCard(context.palpatinesReturn, 'hand');
                    context.player2.passAction();
                };

                // Scenario 1: Play a force unit for 8 less
                context.player1.clickCard(context.palpatinesReturn);
                expect(context.player1).toBeAbleToSelectExactly([context.supremeLeaderSnoke, context.avenger]);

                let exhaustedResourcesBeforeAction = context.player1.exhaustedResourceCount;
                context.player1.clickCard(context.supremeLeaderSnoke);
                expect(context.player1.exhaustedResourceCount).toBe(exhaustedResourcesBeforeAction + 2); // 2 for out of aspect Snoke
                expect(context.supremeLeaderSnoke).toBeInZone('groundArena', context.player1);

                reset();

                // Scenario 2: Play a unit for 6 less
                exhaustedResourcesBeforeAction = context.player1.exhaustedResourceCount;
                context.player1.clickCard(context.palpatinesReturn);

                expect(context.player1.exhaustedResourceCount).toBe(exhaustedResourcesBeforeAction + 6 + 5); // 6 for Palpatine's Return, 5 for out of aspect Avenger
                expect(context.avenger).toBeInZone('spaceArena', context.player1);

                reset();

                // Scenario 3: Do nothing if there are no units in the discard
                context.player1.clickCard(context.palpatinesReturn);

                expect(context.player2).toBeActivePlayer();
                expect(context.palpatinesReturn).toBeInZone('discard', context.player1);
            });
        });
    });
});
