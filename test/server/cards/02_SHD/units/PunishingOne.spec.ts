describe('Punishing One', function() {
    integration(function(contextRef) {
        describe('Punishing One\'s ability', function() {
            beforeEach(function () {
                contextRef.setupTest({
                    phase: 'action',
                    player1: {
                        hand: ['vanquish'],
                        groundArena: ['phaseiii-dark-trooper'],
                        spaceArena: [{ card: 'punishing-one#dengars-jumpmaster', exhausted: true }],
                    },
                    player2: {
                        hand: ['rivals-fall'],
                        groundArena: [{ card: 'wampa', upgrades: ['experience'] }],
                        spaceArena: ['tieln-fighter', { card: 'privateer-scyk', upgrades: ['experience'] }, { card: 'outland-tie-vanguard', upgrades: ['experience'] }, { card: 'mining-guild-tie-fighter', upgrades: ['experience'] }],
                    }
                });
            });

            it('should be able to ready when an upgraded enemy unit is defeated', function () {
                const reset = (passAction = true) => {
                    context.punishingOne.exhausted = false;
                    context.punishingOne.damage = 0;
                    if (passAction) {
                        context.player2.passAction();
                    }
                };

                // CASE 1: Punishing One readies when another unit is defeated
                const { context } = contextRef;
                context.player1.clickCard(context.vanquish);
                context.player1.clickCard(context.wampa);
                expect(context.wampa).toBeInZone('discard');
                context.player1.clickPrompt('Ready this unit');
                expect(context.punishingOne.exhausted).toBe(false);


                context.moveToNextActionPhase();


                // CASE 2: Punishing One readies after defeating a unit with an upgrade
                context.player1.clickCard(context.punishingOne);
                context.player1.clickCard(context.privateerScyk);
                context.player1.clickPrompt('Ready this unit');
                expect(context.punishingOne.exhausted).toBe(false);

                reset(false);
                context.moveToNextActionPhase();

                // CASE 3: Punishing One does not ready after defeating a unit with no upgrade
                context.player1.clickCard(context.punishingOne);
                context.player1.clickCard(context.tielnFighter);
                expect(context.punishingOne.exhausted).toBe(true);

                reset(false);
                context.moveToNextActionPhase();

                // CASE 4: Punishing One should only ready once after defeating 2 units with upgrades
                context.player1.clickCard(context.punishingOne);
                context.player1.clickCard(context.outlandTieVanguard);
                context.player1.clickPrompt('Ready this unit');
                expect(context.punishingOne.exhausted).toBe(false);
                reset();
                context.player1.clickCard(context.punishingOne);
                context.player1.clickCard(context.miningGuildTieFighter);
                expect(context.punishingOne.exhausted).toBe(true);

                context.moveToNextActionPhase();

                // CASE 5: Punishing One should not ready if a friendly upgraded unit is defeated
                context.punishingOne.exhausted = true;
                context.player1.passAction();
                context.player2.clickCard(context.rivalsFall);
                context.player2.clickCard(context.phaseiiiDarkTrooper);
                expect(context.punishingOne.exhausted).toBe(true);
            });
        });
    });
});
