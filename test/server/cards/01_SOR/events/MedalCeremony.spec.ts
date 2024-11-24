describe('Medal Ceremony', function() {
    integration(function(contextRef) {
        describe('Medal Ceremony\'s ability', function() {
            beforeEach(function () {
                contextRef.setupTest({
                    phase: 'action',
                    player1: {
                        hand: ['medal-ceremony'],
                        groundArena: ['battlefield-marine', 'frontier-atrt', 'specforce-soldier'],
                        leader: { card: 'chirrut-imwe#one-with-the-force', deployed: true }
                    },
                    player2: {
                        groundArena: ['wampa', 'consular-security-force'],
                        spaceArena: ['alliance-xwing']
                    }
                });
            });

            it('should give an experience to any Rebel units that attacked this phase, up to 3', function () {
                const { context } = contextRef;

                // attack 1: our rebel
                context.player1.clickCard(context.battlefieldMarine);
                context.player1.clickCard(context.p2Base);

                // attack 2: their non-rebel
                context.player2.clickCard(context.wampa);
                context.player2.clickCard(context.p1Base);

                // attack 3: our rebel (leader)
                context.player1.clickCard(context.chirrutImwe);
                context.player1.clickCard(context.wampa);

                // attack 4: their rebel
                context.player2.clickCard(context.consularSecurityForce);
                context.player2.clickCard(context.p1Base);

                // attack 5: our non-rebel
                context.player1.clickCard(context.frontierAtrt);
                context.player1.clickCard(context.p2Base);

                // attack 6: their rebel
                context.player2.clickCard(context.allianceXwing);

                // attack 7: our rebel (goes to discard)
                context.player1.clickCard(context.specforceSoldier);
                context.player1.clickCard(context.wampa);

                context.player2.passAction();

                context.player1.clickCard(context.medalCeremony);
                expect(context.player1).toBeAbleToSelectExactly([context.battlefieldMarine, context.chirrutImwe, context.consularSecurityForce, context.allianceXwing]);

                context.player1.clickCard(context.battlefieldMarine);
                context.player1.clickCard(context.chirrutImwe);
                context.player1.clickCard(context.allianceXwing);

                // click on a fourth card just to confirm it doesn't work
                context.player1.clickCardNonChecking(context.consularSecurityForce);

                context.player1.clickPrompt('Done');
                expect(context.battlefieldMarine).toHaveExactUpgradeNames(['experience']);
                expect(context.chirrutImwe).toHaveExactUpgradeNames(['experience']);
                expect(context.allianceXwing).toHaveExactUpgradeNames(['experience']);
                expect(context.consularSecurityForce.isUpgraded()).toBe(false);
            });

            it('should give only as many experience tokens as available Rebel units that have attacked', function () {
                const { context } = contextRef;

                // attack 1: our rebel
                context.player1.clickCard(context.battlefieldMarine);
                context.player1.clickCard(context.p2Base);

                // attack 2: their non-rebel
                context.player2.clickCard(context.wampa);
                context.player2.clickCard(context.p1Base);

                // attack 3: our non-rebel
                context.player1.clickCard(context.frontierAtrt);
                context.player1.clickCard(context.p2Base);

                // attack 4: their rebel
                context.player2.clickCard(context.consularSecurityForce);
                context.player2.clickCard(context.p1Base);

                context.player1.clickCard(context.medalCeremony);
                expect(context.player1).toBeAbleToSelectExactly([context.battlefieldMarine, context.consularSecurityForce]);

                context.player1.clickCard(context.battlefieldMarine);
                context.player1.clickCard(context.consularSecurityForce);

                context.player1.clickPrompt('Done');
                expect(context.battlefieldMarine).toHaveExactUpgradeNames(['experience']);
                expect(context.consularSecurityForce).toHaveExactUpgradeNames(['experience']);
            });

            it('should allow selecting fewer targets than available', function () {
                const { context } = contextRef;

                // attack 1: our rebel
                context.player1.clickCard(context.battlefieldMarine);
                context.player1.clickCard(context.p2Base);

                // attack 2: their non-rebel
                context.player2.clickCard(context.wampa);
                context.player2.clickCard(context.p1Base);

                // attack 3: our non-rebel
                context.player1.clickCard(context.frontierAtrt);
                context.player1.clickCard(context.p2Base);

                // attack 4: their rebel
                context.player2.clickCard(context.consularSecurityForce);
                context.player2.clickCard(context.p1Base);

                context.player1.clickCard(context.medalCeremony);
                expect(context.player1).toBeAbleToSelectExactly([context.battlefieldMarine, context.consularSecurityForce]);

                context.player1.clickCard(context.battlefieldMarine);

                context.player1.clickPrompt('Done');
                expect(context.battlefieldMarine).toHaveExactUpgradeNames(['experience']);
                expect(context.consularSecurityForce.isUpgraded()).toBe(false);
            });

            it('should allow selecting no targets', function () {
                const { context } = contextRef;

                // attack 1: our rebel
                context.player1.clickCard(context.battlefieldMarine);
                context.player1.clickCard(context.p2Base);

                // attack 2: their non-rebel
                context.player2.clickCard(context.wampa);
                context.player2.clickCard(context.p1Base);

                // attack 3: our non-rebel
                context.player1.clickCard(context.frontierAtrt);
                context.player1.clickCard(context.p2Base);

                // attack 4: their rebel
                context.player2.clickCard(context.consularSecurityForce);
                context.player2.clickCard(context.p1Base);

                context.player1.clickCard(context.medalCeremony);
                expect(context.player1).toBeAbleToSelectExactly([context.battlefieldMarine, context.consularSecurityForce]);

                context.player1.clickPrompt('Done');
                expect(context.consularSecurityForce.isUpgraded()).toBe(false);
                expect(context.consularSecurityForce.isUpgraded()).toBe(false);
                expect(context.player2).toBeActivePlayer();
            });
        });
    });
});
