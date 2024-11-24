describe('Play upgrade from hand', function() {
    integration(function(contextRef) {
        describe('When an upgrade is played,', function() {
            beforeEach(function () {
                contextRef.setupTest({
                    phase: 'action',
                    player1: {
                        hand: ['entrenched', 'academy-training', 'resilient', 'foundling'],
                        groundArena: ['wampa'],
                        spaceArena: ['tieln-fighter'],
                        leader: 'director-krennic#aspiring-to-authority'
                    },
                    player2: {
                        spaceArena: ['bright-hope#the-last-transport']
                    }
                });
            });

            it('it should be able to be attached to any ground or space unit and apply a stat bonus to it', function () {
                const { context } = contextRef;

                // upgrade attaches to friendly ground unit
                context.player1.clickCard(context.entrenched);
                expect(context.player1).toBeAbleToSelectExactly([context.wampa, context.tielnFighter, context.brightHope]);
                context.player1.clickCard(context.wampa);
                expect(context.wampa.upgrades).toContain(context.entrenched);
                expect(context.wampa.upgrades.length).toBe(1);
                expect(context.entrenched).toBeInZone('groundArena');
                expect(context.wampa.getPower()).toBe(7);
                expect(context.wampa.getHp()).toBe(8);

                expect(context.player1.exhaustedResourceCount).toBe(2);

                context.player2.passAction();

                // upgrade attaches to friendly space unit
                context.player1.clickCard(context.academyTraining);
                expect(context.player1).toBeAbleToSelectExactly([context.wampa, context.tielnFighter, context.brightHope]);
                context.player1.clickCard(context.tielnFighter);
                expect(context.tielnFighter.upgrades).toContain(context.academyTraining);
                expect(context.wampa.upgrades.length).toBe(1);
                expect(context.academyTraining).toBeInZone('spaceArena');
                expect(context.tielnFighter.getPower()).toBe(4);
                expect(context.tielnFighter.getHp()).toBe(3);

                expect(context.player1.exhaustedResourceCount).toBe(6);

                context.player2.passAction();

                // upgrade attaches to enemy unit
                context.player1.clickCard(context.resilient);
                expect(context.player1).toBeAbleToSelectExactly([context.wampa, context.tielnFighter, context.brightHope]);
                context.player1.clickCard(context.brightHope);
                expect(context.brightHope.upgrades).toContain(context.resilient);
                expect(context.wampa.upgrades.length).toBe(1);
                expect(context.resilient).toBeInZone('spaceArena', context.player1);
                expect(context.brightHope.getPower()).toBe(2);
                expect(context.brightHope.getHp()).toBe(9);

                // confirm that the upgrade is still controlled by the player who played it
                expect(context.resilient.controller).toBe(context.player1.player);
            });
        });
    });
});
