describe('Zeb Orrelios, Headstrong Warrior', function () {
    integration(function (contextRef) {
        describe('Zeb Orrelios\'s ability', function () {
            beforeEach(function () {
                contextRef.setupTest({
                    phase: 'action',
                    player1: {
                        groundArena: ['zeb-orrelios#headstrong-warrior', 'swoop-racer'],
                        spaceArena: ['green-squadron-awing']
                    },
                    player2: {
                        groundArena: ['superlaser-technician', 'consular-security-force', 'steadfast-battalion'],
                    }
                });
            });

            it('should deal 4 damage to a ground unit when he kill someone and survives', function () {
                const { context } = contextRef;

                function reset(opponentPass = true) {
                    context.zebOrrelios.exhausted = false;
                    context.setDamage(context.zebOrrelios, 0);
                    if (opponentPass) {
                        context.player2.passAction();
                    }
                }

                // kill superlaser technician, should deal 4 to a ground unit
                context.player1.clickCard(context.zebOrrelios);
                context.player1.clickCard(context.superlaserTechnician);
                context.player2.clickPrompt('Put Superlaser Technician into play as a resource and ready it');
                expect(context.player1).toBeAbleToSelectExactly([context.zebOrrelios, context.swoopRacer, context.consularSecurityForce, context.steadfastBattalion]);
                expect(context.player1).toHavePassAbilityButton();
                context.player1.clickCard(context.consularSecurityForce);
                expect(context.consularSecurityForce.damage).toBe(4);
                expect(context.player2).toBeActivePlayer();

                // reset
                context.setDamage(context.consularSecurityForce, 0);
                reset();

                // consular security force is not defeat, nothing happen
                context.player1.clickCard(context.zebOrrelios);
                context.player1.clickCard(context.consularSecurityForce);
                expect(context.player2).toBeActivePlayer();

                // reset
                reset(false);

                // consular security force attack and die : nothing happen
                context.player2.clickCard(context.consularSecurityForce);
                context.player2.clickCard(context.zebOrrelios);
                expect(context.player1).toBeActivePlayer();

                // zeb kill someone but die too, nothing happen
                context.player1.clickCard(context.zebOrrelios);
                context.player1.clickCard(context.steadfastBattalion);
                expect(context.player2).toBeActivePlayer();
            });
        });

        describe('Zeb Orrelios\'s ability', function () {
            beforeEach(function () {
                contextRef.setupTest({
                    phase: 'action',
                    player1: {
                        groundArena: [{ card: 'zeb-orrelios#headstrong-warrior', upgrades: ['vambrace-flamethrower'] }]
                    },
                    player2: {
                        groundArena: ['battlefield-marine', 'wampa']
                    }
                });
            });

            it('should deal 4 damage to a ground unit when zeb attacks and kill with on attack abilities', function () {
                const { context } = contextRef;

                context.player1.clickCard(context.zebOrrelios);
                context.player1.clickCard(context.battlefieldMarine);

                context.player1.clickPrompt('Deal 3 damage divided as you choose among enemy ground units');

                // kill battlefield marine with flamethrower, zeb should deal 4 damage to another unit
                context.player1.setDistributeDamagePromptState(new Map([
                    [context.battlefieldMarine, 3],
                ]));

                expect(context.player1).toBeAbleToSelectExactly([context.zebOrrelios, context.wampa]);
                expect(context.player1).toHavePassAbilityButton();

                context.player1.clickCard(context.wampa);
                expect(context.wampa.damage).toBe(4);
                expect(context.player2).toBeActivePlayer();
            });
        });
    });
});
