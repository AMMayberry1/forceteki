describe('Arquitens Assault Cruiser', function() {
    integration(function(contextRef) {
        describe('Arquitens Assault Cruiser\'s triggered ability', function() {
            beforeEach(function () {
                contextRef.setupTest({
                    phase: 'action',
                    player1: {
                        hand: ['arquitens-assault-cruiser'],
                        spaceArena: ['tie-advanced']
                    },
                    player2: {
                        spaceArena: [
                            'tieln-fighter',
                            'gideons-light-cruiser#dark-troopers-station',
                            'cartel-spacer',
                            'imperial-interceptor'
                        ]
                    }
                });
            });

            it('will resource a unit for the Arquitens controller if Arquitens attacks and defeats it', function () {
                const { context } = contextRef;

                const reset = (passAction = true) => {
                    context.setDamage(context.arquitensAssaultCruiser, 0);
                    context.arquitensAssaultCruiser.exhausted = false;
                    if (passAction) {
                        context.player2.passAction();
                    }
                };

                // CASE 1: Arquitens ambush kills a unit
                context.player1.clickCard(context.arquitensAssaultCruiser);
                context.player1.clickPrompt('Ambush');
                context.player1.clickCard(context.tielnFighter);
                expect(context.tielnFighter).toBeInZone('resource', context.player1);
                expect(context.tielnFighter.exhausted).toBeTrue();
                expect(context.arquitensAssaultCruiser.damage).toBe(2);
                expect(context.player2).toBeActivePlayer();

                reset();

                // CASE 2: Arquitens attacks and does not defeat, ability does not trigger
                context.player1.clickCard(context.arquitensAssaultCruiser);
                context.player1.clickCard(context.gideonsLightCruiser);
                expect(context.gideonsLightCruiser).toBeInZone('spaceArena');
                expect(context.gideonsLightCruiser.damage).toBe(7);
                expect(context.arquitensAssaultCruiser.damage).toBe(7);

                reset(false);

                // CASE 3: Enemy attacks into Arquitens and dies, ability doesn't trigger
                context.player2.clickCard(context.cartelSpacer);
                context.player2.clickCard(context.arquitensAssaultCruiser);
                expect(context.cartelSpacer).toBeInZone('discard');
                expect(context.arquitensAssaultCruiser.damage).toBe(2);

                reset(false);

                // CASE 4: friendly unit trades with enemy unit, Arquitens ability does not trigger
                expect(context.player1).toBeActivePlayer();
                context.player1.clickCard(context.tieAdvanced);
                context.player1.clickCard(context.imperialInterceptor);
                expect(context.tieAdvanced).toBeInZone('discard');
                expect(context.imperialInterceptor).toBeInZone('discard');
            });
        });

        // TODO: update trigger condition so that defender being defeated by attacker at the 'on attack' stage will also work

        // describe('Mace\'s triggered ability', function() {
        //     beforeEach(function () {
        //         contextRef.setupTest({
        //             phase: 'action',
        //             player1: {
        //                 groundArena: [{ card: 'mace-windu#party-crasher', upgrades: ['fallen-lightsaber'] }]
        //             },
        //             player2: {
        //                 groundArena: ['jawa-scavenger']
        //             }
        //         });
        //     });
        //
        //     it('will not ready him if the unit is defeated by an on-attack ability', function () {
        //         const { context } = contextRef;
        //
        //         context.player1.clickCard(context.maceWindu);
        //         context.player1.clickCard(context.jawaScavenger);
        //
        //         expect(context.jawaScavenger).toBeInZone('discard');
        //         expect(context.maceWindu.damage).toBe(0);
        //         expect(context.maceWindu.exhausted).toBeFalse();
        //     });
        // });
    });
});
