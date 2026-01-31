import { Decoration, EditorView } from "@codemirror/view";
import { StateField, StateEffect, RangeSetBuilder } from "@codemirror/state";

// Efecto para actualizar la búsqueda
export interface SearchQuery {
    search: string;
    caseSensitive: boolean;
    wholeWord: boolean;
}

export const setCinematicSearch = StateEffect.define<SearchQuery>();
export const clearCinematicSearch = StateEffect.define<void>();

interface Match {
    from: number;
    to: number;
}

interface CinematicSearchState {
    query: SearchQuery;
    matches: Match[];
    activeIndex: number;
}

const defaultState: CinematicSearchState = {
    query: { search: "", caseSensitive: false, wholeWord: false },
    matches: [],
    activeIndex: -1,
};

// Estilos para los resaltados
const matchDecoration = Decoration.mark({ class: "cm-cinematic-match" });
const activeMatchDecoration = Decoration.mark({
    class: "cm-cinematic-match-active",
});

export const setActiveMatchIndex = StateEffect.define<number>();

export const cinematicSearchField = StateField.define<CinematicSearchState>({
    create() {
        return defaultState;
    },
    update(value, tr) {
        for (let effect of tr.effects) {
            if (effect.is(setCinematicSearch)) {
                const query = effect.value;
                if (!query.search) return defaultState;

                const matches = findMatches(tr.state.doc.toString(), query);
                return {
                    query,
                    matches,
                    activeIndex: matches.length > 0 ? 0 : -1,
                };
            }
            if (effect.is(clearCinematicSearch)) {
                return defaultState;
            }
            if (effect.is(setActiveMatchIndex)) {
                return { ...value, activeIndex: effect.value };
            }
        }

        // Si el documento cambia, recalculamos coincidencias
        if (tr.docChanged && value.query.search) {
            const matches = findMatches(tr.state.doc.toString(), value.query);
            return { ...value, matches };
        }

        return value;
    },
    provide: (f) =>
        EditorView.decorations.from(f, (state) => {
            if (!state.query.search || state.matches.length === 0)
                return Decoration.none;

            const builder = new RangeSetBuilder<Decoration>();
            state.matches.forEach((match, index) => {
                const deco =
                    index === state.activeIndex
                        ? activeMatchDecoration
                        : matchDecoration;
                builder.add(match.from, match.to, deco);
            });
            return builder.finish();
        }),
});

// Función para encontrar coincidencias manual
function findMatches(text: string, query: SearchQuery): Match[] {
    const matches: Match[] = [];
    const searchStr = query.search;
    if (!searchStr) return matches;

    let flags = "g";
    if (!query.caseSensitive) flags += "i";

    let pattern = searchStr.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    if (query.wholeWord) pattern = `\\b${pattern}\\b`;

    try {
        const regex = new RegExp(pattern, flags);
        let match;

        while ((match = regex.exec(text)) !== null) {
            matches.push({
                from: match.index,
                to: match.index + match[0].length,
            });
            if (match.index === regex.lastIndex) regex.lastIndex++; // Prevenir bucles infinitos
        }
    } catch (e) {
        // Regex inválido silenciado
    }

    return matches;
}

// Comandos de navegación
export function gotoNextMatch(view: EditorView) {
    const state = view.state.field(cinematicSearchField);
    if (state.matches.length === 0) return;

    const nextIndex = (state.activeIndex + 1) % state.matches.length;
    updateActiveMatchAndSelection(view, nextIndex);
}

export function gotoPrevMatch(view: EditorView) {
    const state = view.state.field(cinematicSearchField);
    if (state.matches.length === 0) return;

    const prevIndex =
        (state.activeIndex - 1 + state.matches.length) % state.matches.length;
    updateActiveMatchAndSelection(view, prevIndex);
}

function updateActiveMatchAndSelection(view: EditorView, index: number) {
    const state = view.state.field(cinematicSearchField);
    const match = state.matches[index];

    // Actualizar el estado interno del field (activeIndex)
    // Para simplificar, solo movemos la selección y el scroll
    view.dispatch({
        selection: { anchor: match.from, head: match.to },
        scrollIntoView: true,
        effects: setActiveMatchIndex.of(index),
        userEvent: "select.search",
    });
}

// Inyectar estilos CSS necesarios
export const cinematicSearchTheme = EditorView.theme({
    ".cm-cinematic-match": {
        backgroundColor: "rgba(125, 211, 252, 0.2)",
        borderBottom: "1px solid rgba(125, 211, 252, 0.4)",
    },
    ".cm-cinematic-match-active": {
        backgroundColor: "rgba(125, 211, 252, 0.45) !important",
        outline: "1px solid var(--cerulean-400)",
        borderRadius: "2px",
    },
});
