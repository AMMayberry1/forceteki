describe('Defeat timing', function() {
    integration(function(contextRef) {
        // describe('When a unit enters play with a constant ability that defeats other units,', function() {
        //     beforeEach(function () {
        //         contextRef.setupTest({
        //             phase: 'action',
        //             player1: {
        //                 hand: ['supreme-leader-snoke#shadow-ruler'],
        //                 groundArena: ['maz-kanata#pirate-queen'],
        //             },
        //             player2: {
        //                 groundArena: ['vanguard-infantry'],
        //             }
        //         });
        //     });

        //     it('"when played" and "when defeated" triggers should go in the same window', function () {
        //         const { context } = contextRef;

        //         context.player1.clickCard(context.supremeLeaderSnoke);
        //         expect(context.player1).toHavePrompt('Both players have triggered abilities in response. Choose a player to resolve all of their abilities first:');
        //         expect(context.player2).toHavePrompt('Waiting for opponent to choose a player to resolve their triggers first');

        //         context.player1.clickPrompt('You');
        //         expect(context.mazKanata).toHaveExactUpgradeNames(['experience']);

        //         // vanguard on-defeat trigger happens next automatically
        //         expect(context.player2).toBeAbleToSelectExactly([context.mazKanata, context.supremeLeaderSnoke]);
        //         context.player2.clickPrompt('Pass ability');

        //         expect(context.player2).toBeActivePlayer();
        //     });
        // });

        // // TODO: add a similar test for Dodonna and units leaving the field due to a +hp modifier going away
        // describe('When a unit enters play and is immediately defeated by a constant ability,', function() {
        //     beforeEach(function () {
        //         contextRef.setupTest({
        //             phase: 'action',
        //             player1: {
        //                 groundArena: ['supreme-leader-snoke#shadow-ruler'],
        //             },
        //             player2: {
        //                 hand: ['vanguard-infantry'],
        //                 groundArena: [{ card: 'maz-kanata#pirate-queen', upgrades: ['experience', 'experience'] }]
        //             }
        //         });
        //     });

        //     it('"when played" and "when defeated" triggers should go in the same window', function () {
        //         const { context } = contextRef;

        //         context.player1.passAction();

        //         context.player2.clickCard(context.vanguardInfantry);
        //         expect(context.player2).toHavePrompt('Choose an ability to resolve:');
        //         expect(context.player1).toHavePrompt('Waiting for opponent to use Choose Triggered Ability Resolution Order');
        //         expect(context.vanguardInfantry).toBeInZone('discard');

        //         context.player2.clickPrompt('Give an Experience token to a unit');
        //         context.player2.clickPrompt('Pass ability');

        //         // maz kanata on-play trigger happens next automatically
        //         expect(context.mazKanata).toHaveExactUpgradeNames(['experience', 'experience', 'experience']);
        //         expect(context.player1).toBeActivePlayer();
        //     });
        // });

        describe('When a unit enters play and is immediately defeated by a constant ability,', function() {
            beforeEach(function () {
                contextRef.setupTest({
                    phase: 'action',
                    player1: {
                        groundArena: ['supreme-leader-snoke#shadow-ruler'],
                    },
                    player2: {
                        hand: ['vanguard-infantry', 'lieutenant-childsen#death-star-prison-warden', 'vanquish']
                    }
                });
            });

            it('it cannot gain experience from its "when played" ability', function () {
                const { context } = contextRef;

                context.player1.passAction();

                context.player2.clickCard(context.lieutenantChildsen);

                expect(context.lieutenantChildsen).toBeInZone('discard');
                context.player2.clickPrompt('Reveal up to 4 Vigilance cards from your hand -> Vanquish');
                expect(context.player1).toBeActivePlayer();
            });
        });

        // describe('When multiple units are defeated simultaneously,', function() {
        //     beforeEach(function () {
        //         contextRef.setupTest({
        //             phase: 'action',
        //             player1: {
        //                 hand: ['superlaser-blast'],
        //                 groundArena: ['general-krell#heartless-tactician'],
        //                 spaceArena: ['cartel-spacer'],
        //                 leader: { card: 'iden-versio#inferno-squad-commander', deployed: true },
        //                 base: { card: 'administrators-tower', damage: 5 }
        //             },
        //             player2: {
        //                 groundArena: ['superlaser-technician', 'yoda#old-master'],
        //                 leader: { card: 'luke-skywalker#faithful-friend', deployed: true }
        //             }
        //         });
        //     });

        //     it('the active player should choose which player\'s triggers happen first, then each player should be able to choose the order of their triggers in turn', function () {
        //         const { context } = contextRef;

        //         context.player1.clickCard(context.superlaserBlast);

        //         // all units defeated
        //         expect(context.generalKrell).toBeInZone('discard');
        //         expect(context.cartelSpacer).toBeInZone('discard');
        //         expect(context.superlaserTechnician).toBeInZone('discard');
        //         expect(context.yoda).toBeInZone('discard');
        //         expect(context.idenVersio).toBeInZone('base');
        //         expect(context.lukeSkywalker).toBeInZone('base');

        //         // triggered abilities happen
        //         expect(context.player1).toHavePrompt('Both players have triggered abilities in response. Choose a player to resolve all of their abilities first:');
        //         context.player1.clickPrompt('You');
        //         expect(context.player1).toHavePrompt('Choose an ability to resolve:');
        //         expect(context.player1).toHaveExactPromptButtons(['Draw a card', 'Draw a card', 'When an opponent\'s unit is defeated, heal 1 from base', 'When an opponent\'s unit is defeated, heal 1 from base', 'When an opponent\'s unit is defeated, heal 1 from base']);
        //         context.player1.clickPrompt('When an opponent\'s unit is defeated, heal 1 from base');
        //         context.player1.clickPrompt('When an opponent\'s unit is defeated, heal 1 from base');
        //         context.player1.clickPrompt('Draw a card');
        //         // may ability prompts the player whether or not to actually use it before it fully resolves
        //         expect(context.player1).toHavePassAbilityPrompt('Draw a card');
        //         context.player1.clickPrompt('Draw a card');
        //         expect(context.player1).toHaveExactPromptButtons(['Draw a card', 'When an opponent\'s unit is defeated, heal 1 from base']);
        //         context.player1.clickPrompt('When an opponent\'s unit is defeated, heal 1 from base');
        //         // last trigger is chosen automatically
        //         expect(context.player1).toHavePassAbilityPrompt('Draw a card');
        //         context.player1.clickPrompt('Pass');

        //         // automatically moves to other player's triggers
        //         expect(context.player2).toHavePrompt('Choose an ability to resolve:');
        //         expect(context.player2).toHaveExactPromptButtons(['Put Superlaser Technician into play as a resource and ready it', 'Choose any number of players to draw 1 card']);
        //         context.player2.clickPrompt('Choose any number of players to draw 1 card');
        //         context.player2.clickPrompt('You');
        //         context.player2.clickPrompt('Done');
        //         expect(context.player2).toHavePassAbilityPrompt('Put Superlaser Technician into play as a resource and ready it');
        //         context.player2.clickPrompt('Put Superlaser Technician into play as a resource and ready it');

        //         // triggers all done, action is finally over
        //         expect(context.player2).toBeActivePlayer();

        //         // checking trigger effects all happened properly
        //         expect(context.p1Base.damage).toBe(2);
        //         expect(context.player1.hand.length).toBe(1);
        //         expect(context.player2.hand.length).toBe(1);
        //         expect(context.superlaserTechnician).toBeInZone('resource');
        //     });
        // });
    });
});
