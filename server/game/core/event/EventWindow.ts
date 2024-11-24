import { AbilityContext } from '../ability/AbilityContext';
import CardAbilityStep from '../ability/CardAbilityStep';
import { AbilityType } from '../Constants';
import { TriggeredAbilityWindow } from '../gameSteps/abilityWindow/TriggeredAbilityWindow';
import { BaseStepWithPipeline } from '../gameSteps/BaseStepWithPipeline';
import { SimpleStep } from '../gameSteps/SimpleStep';
import * as Contract from '../utils/Contract';

export enum TriggerHandlingMode {

    /** Any abilities triggered during this event window will not be resolved immediately but passed to the parent window */
    PassesTriggersToParentWindow = 'passesTriggersToParentWindow',

    /** Any abilities triggered during this event window or passed up from child windows will be resolved immediately. */
    ResolvesTriggers = 'resolvesTriggers',

    /** This event window is not a type that should trigger abilities, so any triggers that happen are an error */
    CannotHaveTriggers = 'cannotHaveTriggers',
}

export class EventWindow extends BaseStepWithPipeline {
    protected _events: any[] = [];
    protected _triggeredAbilityWindow?: TriggeredAbilityWindow = null;

    private parentWindow?: EventWindow = null;
    private resolvedEvents: any[] = [];
    private subwindowEvents: any[] = [];
    private subAbilityStepFn?: () => AbilityContext = null;
    private windowDepth?: number = null;

    public get events() {
        return this._events;
    }

    public get triggerHandlingMode() {
        return this._triggerHandlingMode;
    }

    public get triggeredAbilityWindow() {
        if (this.triggerHandlingMode === TriggerHandlingMode.CannotHaveTriggers) {
            Contract.fail(`Attempting to access triggered ability window for type(s) ${this} which cannot trigger abilities`);
        }

        return this._triggeredAbilityWindow;
    }

    /** Creates an object holding one or more GameEvents that occur at the same time.
     *  @param game - The game object.
     *  @param {GameEvent[]} events - Events belonging to this window.
     *  @param {TriggerHandlingMode} triggerHandlingMode - Whether this event window should create its own TriggeredAbilityWindow which will resolve after its events (and any nested events).
     * If set to {@link TriggerHandlingMode.PassesTriggersToParentWindow}, this window will borrow its parent EventWindow's TriggeredAbilityWindow, which will receive any triggers that trigger
     * during this EventWindow's events, to be resolved after all nested events of its owner are done.
     */
    public constructor(
        game,
        events,
        private _triggerHandlingMode: TriggerHandlingMode = TriggerHandlingMode.PassesTriggersToParentWindow
    ) {
        super(game);

        events.forEach((event) => {
            if (event.canResolve) {
                this.addEvent(event);
            }
        });

        this.initialise();
    }

    public initialise() {
        this.pipeline.initialise([
            new SimpleStep(this.game, () => this.setParentEventWindow(), 'setParentEventWindow'),
            new SimpleStep(this.game, () => this.checkEventCondition(), 'checkEventCondition'),
            new SimpleStep(this.game, () => this.openReplacementEffectWindow(), 'openReplacementEffectWindow'),
            new SimpleStep(this.game, () => this.generateContingentEvents(), 'generateContingentEvents'),
            new SimpleStep(this.game, () => this.preResolutionEffects(), 'preResolutionEffects'),
            new SimpleStep(this.game, () => this.resolveEvents(), 'resolveEvents'),
            new SimpleStep(this.game, () => this.checkUniqueRule(), 'checkUniqueRule'),
            new SimpleStep(this.game, () => this.resolveGameState(), 'resolveGameState'),
            new SimpleStep(this.game, () => this.resolveSubwindowEvents(), 'checkSubwindowEvents'),
            new SimpleStep(this.game, () => this.resolveSubAbilityStep(), 'checkThenAbilitySteps'),
            new SimpleStep(this.game, () => this.resolveTriggersIfNecessary(), 'resolveTriggersIfNecessary'),
            new SimpleStep(this.game, () => this.cleanup(), 'cleanup')
        ]);
    }

    public addEvent(event) {
        event.setWindow(this);
        this._events.push(event);
        return event;
    }

    public removeEvent(event) {
        this._events = this._events.filter((e) => e !== event);
        return event;
    }

    /**
     * "Sub-ability-steps" are subsequent steps after the initial ability effect, such as "then" or "if you do."
     * This function sets a generator method which will be used to evaluate the context after event resolution and,
     * if appropriate, create the sub-ability step to be resolved next
     */
    public setSubAbilityStep(subAbilityStepFn: () => AbilityContext) {
        Contract.assertIsNullLike(this.subAbilityStepFn, 'Attempting to set event window\'s then ability but it is already set');

        this.subAbilityStepFn = subAbilityStepFn;
    }

    /**
     * Adds "sub-window" events which will have priority resolution and be resolved immediately after the currently resolving
     * set of events, preceding the next steps of the currently resolving ability.
     *
     * Typically used for defeat events.
     */
    public addSubwindowEvents(events) {
        this.subwindowEvents = this.subwindowEvents.concat(events);
    }

    /** Set parent event window and initialize triggering window based on configured rules and parent window settings (if relevant) */
    private setParentEventWindow() {
        this.parentWindow = this.game.currentEventWindow;
        this.windowDepth = this.parentWindow ? this.parentWindow.windowDepth + 1 : 0;

        if (this.windowDepth >= 50) {
            throw new Error('Event window depth has reached 50, likely caught in an infinite loop');
        }

        this.game.currentEventWindow = this;

        if (this._triggerHandlingMode === TriggerHandlingMode.PassesTriggersToParentWindow) {
            Contract.assertNotNullLike(this.parentWindow, `Attempting to create event window ${this} as a child window but no parent window exists`);
            Contract.assertFalse(this.parentWindow.triggerHandlingMode === TriggerHandlingMode.CannotHaveTriggers, `${this} is attempting pass triggers to ${this.parentWindow} which cannot have ability triggers`);
        }

        switch (this.triggerHandlingMode) {
            case TriggerHandlingMode.PassesTriggersToParentWindow:
                this._triggeredAbilityWindow = this.parentWindow.triggeredAbilityWindow;
                break;
            case TriggerHandlingMode.ResolvesTriggers:
                this._triggeredAbilityWindow = new TriggeredAbilityWindow(this.game, this, AbilityType.Triggered);
                break;
            case TriggerHandlingMode.CannotHaveTriggers:
                this._triggeredAbilityWindow = null;
                break;
            default:
                Contract.fail(`Unknown value for triggerHandlingMode: ${this.triggerHandlingMode}`);
        }
    }

    private checkEventCondition() {
        this._events.forEach((event) => event.checkCondition());
    }

    private openReplacementEffectWindow() {
        if (this._events.length === 0) {
            return;
        }

        // TODO EFFECTS: will need resolution for replacement effects here
        // not sure if it will need a new window class or can just reuse the existing one
        const replacementEffectWindow = new TriggeredAbilityWindow(this.game, this, AbilityType.ReplacementEffect);
        replacementEffectWindow.emitEvents();
        this.queueStep(replacementEffectWindow);
    }

    /**
     * Creates any "contingent" events which will happen in the same window as the primary event
     * but will be resolved after it in order. The main use case for this is upgrades being
     * defeated at the same time as the parent card holding them.
     */
    private generateContingentEvents() {
        let contingentEvents = [];
        this._events.forEach((event) => {
            contingentEvents = contingentEvents.concat(event.generateContingentEvents());
        });
        contingentEvents.forEach((event) => this.addEvent(event));
    }

    private preResolutionEffects() {
        this._events.forEach((event) => event.preResolutionEffect());
    }

    protected resolveEvents() {
        const eventsToResolve = this._events.sort((event) => event.order);

        // we emit triggered abilities here to ensure that they get triggered in case e.g. an ability is blanked during event resolution
        if (this.triggerHandlingMode !== TriggerHandlingMode.CannotHaveTriggers) {
            this._triggeredAbilityWindow.addTriggeringEvents(this._events);
            this._triggeredAbilityWindow.emitEvents();
        }

        for (const event of eventsToResolve) {
            // need to checkCondition here to ensure the event won't fizzle due to another event's resolution (e.g. double honoring an ordinary character with YR etc.)
            event.checkCondition();
            if (event.canResolve) {
                this.game.emit(event.name, event);
                event.executeHandler();

                this.resolvedEvents.push(event);
            }
        }
    }

    // check for duplicates of unique cards
    private checkUniqueRule() {
        this.game.checkUniqueRule();
    }

    // resolve game state and emit triggers again
    // this is to catch triggers on cards that entered play or gained abilities during event resolution
    private resolveGameState() {
        // TODO: understand if resolveGameState really needs the resolvedEvents array or not
        this.game.resolveGameState(this.resolvedEvents.some((event) => event.handler), this.resolvedEvents);

        // emit the events a second time post-resolution for the sake of potential keywords gained during
        // resolution (such as Ambush) which came online during resolveGameState() and need to register triggers
        for (const event of this.resolvedEvents) {
            this.game.emit(event.name + ':postResolve', event);
        }

        // trigger again here to catch any events for cards that entered play during event resolution
        if (this.triggerHandlingMode !== TriggerHandlingMode.CannotHaveTriggers) {
            this._triggeredAbilityWindow.emitEvents();
        }
    }

    // resolve any events queued for a subwindow (typically defeat events)
    private resolveSubwindowEvents() {
        if (this.subwindowEvents.length > 0) {
            this.queueStep(new EventWindow(this.game, this.subwindowEvents));
        }
    }

    // if the effect has an additional "then" or "if you do (not)" step, resolve it
    private resolveSubAbilityStep() {
        if (this.subAbilityStepFn == null) {
            return;
        }

        const subAbilityStep = this.subAbilityStepFn();
        if (!!subAbilityStep) {
            this.game.resolveAbility(subAbilityStep);
        }
    }

    private resolveTriggersIfNecessary() {
        if (this.triggerHandlingMode === TriggerHandlingMode.ResolvesTriggers) {
            this.queueStep(this._triggeredAbilityWindow);
        }
    }

    private cleanup() {
        for (const event of this.resolvedEvents) {
            event.cleanup();
        }

        if (this.parentWindow) {
            this.parentWindow.checkEventCondition();
            this.game.currentEventWindow = this.parentWindow;
        } else {
            this.game.currentEventWindow = null;
        }
    }

    public override toString() {
        return `'EventWindow: ${this._events.map((event) => event.name).join(', ')}'`;
    }
}
