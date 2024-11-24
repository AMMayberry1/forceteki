describe('Jabba\'s Rancor, Pateesa', function () {
    integration(function (contextRef) {
        describe('Jabba\'s Rancor\'s abilities', function () {
            it('should not decrease cost because we do not control Jabba the Hutt', function () {
                contextRef.setupTest({
                    phase: 'action',
                    player1: {
                        hand: ['jabbas-rancor#pateesa'],
                        leader: 'hondo-ohnaka#thats-good-business'
                    },
                });
                const { context } = contextRef;

                context.player1.clickCard(context.jabbasRancor);
                expect(context.player1.exhaustedResourceCount).toBe(8);
            });

            it('should decrease the cost because we control Jabba the Hutt as leader', function () {
                contextRef.setupTest({
                    phase: 'action',
                    player1: {
                        hand: ['jabbas-rancor#pateesa'],
                        leader: 'jabba-the-hutt#his-high-exaltedness'
                    },
                });
                const { context } = contextRef;

                context.player1.clickCard(context.jabbasRancor);
                expect(context.player1.exhaustedResourceCount).toBe(7);
            });

            it('should decrease the cost because we control Jabba the Hutt as unit and should deal 3 damage to an another friendly ground unit and an enemy ground unit ', function () {
                contextRef.setupTest({
                    phase: 'action',
                    player1: {
                        hand: ['jabbas-rancor#pateesa'],
                        groundArena: ['jabba-the-hutt#cunning-daimyo', 'hylobon-enforcer'],
                        leader: 'hondo-ohnaka#thats-good-business'
                    },
                    player2: {
                        groundArena: ['partisan-insurgent', 'wampa'],
                        spaceArena: ['green-squadron-awing']
                    }
                });

                const { context } = contextRef;

                // play jabba's rancor
                context.player1.clickCard(context.jabbasRancor);
                expect(context.player1.exhaustedResourceCount).toBe(7);

                // should choose another friendly ground unit
                expect(context.player1).toBeAbleToSelectExactly([context.jabbaTheHutt, context.hylobonEnforcer]);
                expect(context.player1).not.toHaveChooseNoTargetButton();
                expect(context.player1).not.toHavePassAbilityButton();
                context.player1.clickCard(context.jabbaTheHutt);

                // should choose an enemy ground unit
                expect(context.player1).toBeAbleToSelectExactly([context.wampa, context.partisanInsurgent]);
                expect(context.player1).not.toHaveChooseNoTargetButton();
                expect(context.player1).not.toHavePassAbilityButton();
                context.player1.clickCard(context.wampa);

                // both should have 3 damage
                expect(context.jabbaTheHutt.damage).toBe(3);
                expect(context.wampa.damage).toBe(3);

                context.jabbasRancor.exhausted = false;
                context.player2.passAction();

                // attack with jabba's rancor, ability should repeat
                context.player1.clickCard(context.jabbasRancor);
                context.player1.clickCard(context.p2Base);

                expect(context.player1).toBeAbleToSelectExactly([context.jabbaTheHutt, context.hylobonEnforcer]);
                context.player1.clickCard(context.hylobonEnforcer);

                expect(context.player1).toBeAbleToSelectExactly([context.wampa, context.partisanInsurgent]);
                context.player1.clickCard(context.partisanInsurgent);

                expect(context.hylobonEnforcer.damage).toBe(3);
                expect(context.partisanInsurgent.damage).toBe(3);
            });

            it('should deal 3 damage to an another friendly ground unit (enemy does not control ground unit)', function () {
                contextRef.setupTest({
                    phase: 'action',
                    player1: {
                        hand: ['jabbas-rancor#pateesa'],
                        groundArena: ['jabba-the-hutt#cunning-daimyo', 'hylobon-enforcer'],
                    },
                });

                const { context } = contextRef;

                // play jabba's rancor
                context.player1.clickCard(context.jabbasRancor);

                // choose another friendly ground unit
                expect(context.player1).toBeAbleToSelectExactly([context.jabbaTheHutt, context.hylobonEnforcer]);
                expect(context.player1).not.toHaveChooseNoTargetButton();
                expect(context.player1).not.toHavePassAbilityButton();

                context.player1.clickCard(context.jabbaTheHutt);
                expect(context.jabbaTheHutt.damage).toBe(3);
            });

            it('should deal 3 damage to an enemy ground unit (we do not control another ground unit)', function () {
                contextRef.setupTest({
                    phase: 'action',
                    player1: {
                        hand: ['jabbas-rancor#pateesa'],
                    },
                    player2: {
                        groundArena: ['partisan-insurgent', 'wampa'],
                    }
                });
                const { context } = contextRef;

                // play jabba's rancor
                context.player1.clickCard(context.jabbasRancor);

                // choose an enemy ground unit
                expect(context.player1).toBeAbleToSelectExactly([context.wampa, context.partisanInsurgent]);
                expect(context.player1).not.toHaveChooseNoTargetButton();
                expect(context.player1).not.toHavePassAbilityButton();

                context.player1.clickCard(context.wampa);
                expect(context.wampa.damage).toBe(3);
            });
        });
    });
});
