/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
'use strict';

import URI from 'vscode-uri';

import * as lsp from 'vscode-languageserver-protocol';

import {
	Id, Vertex, E,
	Project, Document, HoverResult, ReferenceResult,
	contains, textDocument_definition, textDocument_references, textDocument_diagnostic, textDocument_hover, item, DiagnosticResult, Range, RangeTag, RangeId,
	DeclarationRange, ReferenceRange, DocumentSymbolResult, textDocument_documentSymbol, ReferenceTag, DeclarationTag, UnknownTag, DefinitionResult, ReferenceResultId,
	DefinitionResultType, ImplementationResult, ImplementationResultId, textDocument_implementation, textDocument_typeDefinition, TypeDefinitionResultType,
	TypeDefinitionResult, FoldingRangeResult, textDocument_foldingRange, RangeBasedDocumentSymbol, DefinitionTag, DefinitionRange, ResultSet, refersTo, MetaData,
	ExportResult, ExportItem, ExternalImportItem, ExternalImportResult, $exports, $imports, Location, ElementTypes, VertexLabels, EdgeLabels
} from './shared/protocol';

export interface BuilderOptions {
	idGenerator?: () => Id;
	emitSource?: boolean;
}

export interface ResolvedBuilderOptions {
	idGenerator: () => Id;
	emitSource: boolean;
}

export class VertexBuilder {

	constructor(private options: ResolvedBuilderOptions) {
	}

	private nextId(): Id {
		return this.options.idGenerator();
	}

	private get emitSource(): boolean {
		return this.options.emitSource;
	}

	public metaData(version: string): MetaData {
		return {
			id: this.nextId(),
			type: ElementTypes.vertex,
			label: VertexLabels.metaData,
			version,
		}
	}

	public project(contents?: string): Project {
		let result: Project = {
			id: this.nextId(),
			type: ElementTypes.vertex,
			label: VertexLabels.project,
			kind: 'typescript'
		}
		if (contents) {
			result.contents = this.encodeString(contents);
		}
		return result;
	}

	public document(path: string, contents?: string): Document {
		let result: Document = {
			id: this.nextId(),
			type: ElementTypes.vertex,
			label: VertexLabels.document,
			uri: URI.file(path).toString(true),
			languageId: 'typescript'
		}
		if (contents) {
			result.contents = this.encodeString(contents);
		}
		return result;
	}

	public externalImportItem(moniker: string, rangeIds: RangeId[]): ExternalImportItem {
		return {
			id: this.nextId(),
			type: ElementTypes.vertex,
			label: VertexLabels.externalImportItem,
			moniker,
			rangeIds
		};
	}

	public externalImportResult(items?: ExternalImportItem[]): ExternalImportResult {
		let result: ExternalImportResult = {
			id: this.nextId(),
			type: ElementTypes.vertex,
			label: VertexLabels.externalImportResult
		};
		if (items !== undefined) {
			result.result = items;
		}
		return result;
	}

	public exportItem(moniker: string, rangeIds: RangeId[]): ExportItem {
		return {
			id: this.nextId(),
			type: ElementTypes.vertex,
			label: VertexLabels.exportItem,
			moniker,
			rangeIds
		};
	}

	public exportResult(items?: ExportItem[]): ExportResult {
		let result: ExportResult = {
			id: this.nextId(),
			type: ElementTypes.vertex,
			label: VertexLabels.exportResult
		};
		if (items !== undefined) {
			result.result = items;
		}
		return result;
	}

	public resultSet(): ResultSet {
		let result: ResultSet = {
			id: this.nextId(),
			type: ElementTypes.vertex,
			label: VertexLabels.resultSet
		}
		return result;
	}

	public range(range: lsp.Range, tag: UnknownTag): Range;
	public range(range: lsp.Range, tag: DeclarationTag): DeclarationRange;
	public range(range: lsp.Range, tag: DefinitionTag): DefinitionRange;
	public range(range: lsp.Range, tag: ReferenceTag): ReferenceRange;
	public range(range: lsp.Range, tag?: RangeTag): Range {
		let result: Range = {
			id: this.nextId(),
			type: ElementTypes.vertex,
			label: VertexLabels.range,
			start: range.start,
			end: range.end,
		}
		if (tag !== undefined) {
			result.tag = tag;
		}
		return result;
	}

	public location(range: lsp.Range): Location {
		return {
			id: this.nextId(),
			type: ElementTypes.vertex,
			label: VertexLabels.location,
			range: range
		}
	}

	public documentSymbolResult(values: lsp.DocumentSymbol[] | RangeBasedDocumentSymbol[]): DocumentSymbolResult {
		return {
			id: this.nextId(),
			type: ElementTypes.vertex,
			label: VertexLabels.documentSymbolResult,
			result: values
		}
	}

	public diagnosticResult(values: lsp.Diagnostic[]): DiagnosticResult {
		return {
			id: this.nextId(),
			type: ElementTypes.vertex,
			label: VertexLabels.diagnosticResult,
			result: values
		};
	}

	public foldingRangeResult(values: lsp.FoldingRange[]): FoldingRangeResult {
		return {
			id: this.nextId(),
			type: ElementTypes.vertex,
			label: VertexLabels.foldingRangeResult,
			result: values
		};
	}

	public hoverResult(value: lsp.Hover): HoverResult;
	public hoverResult(contents: lsp.MarkupContent | lsp.MarkedString | lsp.MarkedString[]): HoverResult;
	public hoverResult(value: lsp.Hover | lsp.MarkupContent | lsp.MarkedString | lsp.MarkedString[]): HoverResult {
		if (lsp.Hover.is(value)) {
			return {
				id: this.nextId(),
				type: ElementTypes.vertex,
				label: VertexLabels.hoverResult,
				result: {
					contents: value.contents,
					range: value.range
				}
			};
		} else {
			return {
				id: this.nextId(),
				type: ElementTypes.vertex,
				label: VertexLabels.hoverResult,
				result: {
					contents: value as (lsp.MarkupContent | lsp.MarkedString | lsp.MarkedString[])
				}
			};
		}
	}

	public definitionResult(values: DefinitionResultType): DefinitionResult {
		return {
			id: this.nextId(),
			type: ElementTypes.vertex,
			label: VertexLabels.definitionResult,
			result: values
		};
	}

	public typeDefinitionResult(values: TypeDefinitionResultType): TypeDefinitionResult {
		return {
			id: this.nextId(),
			type: ElementTypes.vertex,
			label: VertexLabels.typeDefinitionResult,
			result: values
		};
	}

	public referencesResult(): ReferenceResult;
	public referencesResult(referenceResults: ReferenceResultId[]): ReferenceResult;
	public referencesResult(declarations: (RangeId | lsp.Location)[], definitions: (RangeId | lsp.Location)[], references: (RangeId | lsp.Location)[]): ReferenceResult;
	public referencesResult(arg0?: any, arg1?: any, arg2?: any) {
		let result: ReferenceResult = {
			id: this.nextId(),
			type: ElementTypes.vertex,
			label: VertexLabels.referenceResult
		};
		if (arg2 !== undefined) {
			result.declarations = arg0;
			result.definitions = arg1;
			result.references = arg2;
		} else if (arg0 !== undefined) {
			result.referenceResults = arg0;
		}
		return result;
	}

	public implementationResult(): ImplementationResult;
	public implementationResult(implementationResults: ImplementationResultId[]): ImplementationResult;
	public implementationResult(arg0?: ImplementationResultId[]): ImplementationResult {
		let result: ImplementationResult = {
			id: this.nextId(),
			type: ElementTypes.vertex,
			label: VertexLabels.implementationResult
		};
		if (arg0 !== undefined) {
			result.implementationResults = arg0;
		}
		return result;
	}

	private encodeString(contents: string): string | undefined {
		return this.emitSource
			? Buffer.from(contents).toString('base64')
			: undefined;
	}
}

export class EdgeBuilder {

	private _options: ResolvedBuilderOptions;

	constructor(options: ResolvedBuilderOptions) {
		this._options = options;
	}

	private nextId(): Id {
		return this._options.idGenerator();
	}

	public raw(kind: EdgeLabels, from: Id, to: Id): E<Vertex, Vertex, EdgeLabels> {
		return {
			id: this.nextId(),
			type: ElementTypes.edge,
			label: kind,
			outV: from,
			inV: to
		};
	}

	public contains(from: Project, to: Document): contains;
	public contains(from: Document, to: Range): contains;
	public contains(from: Vertex, to: Vertex): contains {
		return {
			id: this.nextId(),
			type: ElementTypes.edge,
			label: EdgeLabels.contains,
			outV: from.id,
			inV: to.id
		};
	}

	public refersTo(from: Range, to: ResultSet): refersTo {
		return {
			id: this.nextId(),
			type: ElementTypes.edge,
			label: EdgeLabels.refersTo,
			outV: from.id,
			inV: to.id
		};
	}

	public $exports(from: Document, to: ExportResult): $exports {
		return {
			id: this.nextId(),
			type: ElementTypes.edge,
			label: EdgeLabels.exports,
			outV: from.id,
			inV: to.id
		};
	}

	public $imports(from: Document, to: ExternalImportResult): $imports {
		return {
			id: this.nextId(),
			type: ElementTypes.edge,
			label: EdgeLabels.imports,
			outV: from.id,
			inV: to.id
		};
	}

	public documentSymbols(from: Document, to: DocumentSymbolResult): textDocument_documentSymbol {
		return {
			id: this.nextId(),
			type: ElementTypes.edge,
			label: EdgeLabels.textDocument_documentSymbol,
			outV: from.id,
			inV: to.id
		};
	}

	public foldingRange(from: Document, to: FoldingRangeResult): textDocument_foldingRange {
		return {
			id: this.nextId(),
			type: ElementTypes.edge,
			label: EdgeLabels.textDocument_foldingRange,
			outV: from.id,
			inV: to.id
		};
	}

	public diagnostic(from: Document, to: DiagnosticResult): textDocument_diagnostic {
		return {
			id: this.nextId(),
			type: ElementTypes.edge,
			label: EdgeLabels.textDocument_diagnostic,
			outV: from.id,
			inV: to.id
		};
	}

	public hover(from: Range | ResultSet, to: HoverResult): textDocument_hover {
		return {
			id: this.nextId(),
			type: ElementTypes.edge,
			label: EdgeLabels.textDocument_hover,
			outV: from.id,
			inV: to.id
		};
	}

	public definition(from: Range | ResultSet, to: DefinitionResult): textDocument_definition {
		return {
			id: this.nextId(),
			type: ElementTypes.edge,
			label: EdgeLabels.textDocument_definition,
			outV: from.id,
			inV: to.id
		}
	}

	public typeDefinition(from: Range | ResultSet, to: TypeDefinitionResult): textDocument_typeDefinition {
		return {
			id: this.nextId(),
			type: ElementTypes.edge,
			label: EdgeLabels.textDocument_typeDefinition,
			outV: from.id,
			inV: to.id
		}
	}

	public references(from: Range | ResultSet, to: ReferenceResult): textDocument_references {
		return {
			id: this.nextId(),
			type: ElementTypes.edge,
			label: EdgeLabels.textDocument_references,
			outV: from.id,
			inV: to.id
		}
	}

	public implementation(from: Range | ResultSet, to: ImplementationResult): textDocument_implementation {
		return {
			id: this.nextId(),
			type: ElementTypes.edge,
			label: EdgeLabels.textDocument_implementation,
			outV: from.id,
			inV: to.id
		}
	}

	public item(from: ExportResult, to: ExportItem): item;
	public item(from: ExternalImportResult, to: ExternalImportItem): item;
	public item(from: ReferenceResult, to: ReferenceResult): item;
	public item(from: ReferenceResult, to: Range, property: 'declaration' | 'definition' | 'reference'): item;
	public item(from: ExternalImportResult | ExportResult | ReferenceResult, to: ExternalImportItem | ExportItem | Range | ReferenceResult, property?: 'declaration' | 'definition' | 'reference'): item {
		switch (from.label) {
			case 'externalImportResult':
			case 'exportResult':
				return {
					id: this.nextId(),
					type: ElementTypes.edge,
					label: EdgeLabels.item,
					outV: from.id,
					inV: to.id
				};
			case 'referenceResult':
				switch (to.label) {
					case 'range':
						return {
							id: this.nextId(),
							type: ElementTypes.edge,
							label: EdgeLabels.item,
							property,
							outV: from.id,
							inV: to.id
						}
					case 'referenceResult': {
						return {
							id: this.nextId(),
							type: ElementTypes.edge,
							label: EdgeLabels.item,
							property: 'referenceResults',
							outV: from.id,
							inV: to.id
						}
					}
				}
		}
		throw new Error('Shouldn\'t happen');
	}
}

export class Builder {

	private _vertex: VertexBuilder;
	private _edge: EdgeBuilder;

	constructor(options: ResolvedBuilderOptions) {
		this._vertex = new VertexBuilder(options);
		this._edge = new EdgeBuilder(options);
	}

	public get vertex(): VertexBuilder {
		return this._vertex;
	}

	public get edge(): EdgeBuilder {
		return this._edge;
	}
}