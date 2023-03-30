import { DefaultButton, IIconProps, PrimaryButton } from '@fluentui/react';
import React, { FormEventHandler, memo, useCallback, useEffect, useState } from 'react';
import { defaultGamepadConfig, DEFAULT_CONFIG_NAME } from '../../shared/gamepadConfig';
import { GamepadConfig, KeyMap, StickNum } from '../../shared/types';
import { getGamepadConfig, isConfigActive } from '../state/selectors';
import { confirm } from '../utils/confirmUtil';
import { useAppSelector } from './hooks/reduxHooks';
import SensitivitySelector from './SensitivitySelector';
import StickSelector from './StickSelector';
import useKeyConfigEditorState from './hooks/useKeyConfigEditorState';
import { exportConfig } from '../utils/importExport';
import KeybindingsTable from './KeybindingsTable';
import { postGa } from '../utils/ga';

const saveIcon: IIconProps = { iconName: 'Save' };
const useIcon: IIconProps = { iconName: 'SkypeCheck' };

interface SensitivityEditorProps {
  name: string;
  onCancelCreate: () => void;
  onDelete: (name: string) => void;
  onSubmitChanges: (name: string, gamepadConfig: GamepadConfig) => void | Promise<any>;
  onActivate: (name: string) => void | Promise<any>;
}

function GamepadConfigEditor({ name, onSubmitChanges, onCancelCreate, onActivate, onDelete }: SensitivityEditorProps) {
  const { status, config: storedGamepadConfig } = useAppSelector((state) => getGamepadConfig(state, name));
  const isActive = useAppSelector((state) => isConfigActive(state, name));
  const isSubmitting = status === 'writing';
  const isNewDraft = !storedGamepadConfig;
  const isDefaultConfig = name === DEFAULT_CONFIG_NAME;
  // assume any "missing" config name is a new gamepad config, since it isn't saved yet
  // and default the draft to the "defaultGamepadConfig"
  const initialGamepadConfig = storedGamepadConfig || defaultGamepadConfig;
  const [state, dispatchState] = useKeyConfigEditorState(initialGamepadConfig);
  const noMouse = state.config.mouseConfig.mouseControls === undefined;
  const hasChanges = isNewDraft || state.changes.keyConfig || state.changes.mouseConfig;
  // Starts in read-only state, but have button to enable editing/save changes?
  const [isEditing, setIsEditing] = useState(isNewDraft);
  useEffect(() => {
    if (isNewDraft) {
      setIsEditing(true);
    } else {
      setIsEditing(false);
    }
    dispatchState({ type: 'reset', config: initialGamepadConfig });
  }, [dispatchState, name, isNewDraft, initialGamepadConfig]);

  const handleKeybindChange = useCallback(
    (button: string, updated: KeyMap) => {
      dispatchState({
        type: 'updateKeyConfig',
        button,
        keyMap: updated,
      });
    },
    [dispatchState],
  );

  const handleMouseControlsChange = useCallback(
    (mouseControls?: StickNum) => {
      dispatchState({
        type: 'updateMouseControls',
        mouseControls,
      });
    },
    [dispatchState],
  );

  const handleActivate = useCallback(() => {
    onActivate(name);
  }, [name, onActivate]);

  const handleToggleEditing = useCallback(() => {
    if (isNewDraft && isEditing) {
      if (confirm('Are you sure you want to cancel creating a new preset?')) {
        onCancelCreate();
      }
      return;
    }
    if (isEditing && (!hasChanges || confirm('Are you sure you want to cancel? You will lose any changes.'))) {
      // Reset
      dispatchState({ type: 'reset', config: storedGamepadConfig });
      setIsEditing(!isEditing);
    } else if (!isEditing) {
      setIsEditing(!isEditing);
    }
  }, [dispatchState, hasChanges, isEditing, isNewDraft, onCancelCreate, storedGamepadConfig]);

  const handleDelete = useCallback(() => {
    if (confirm('Are you sure you want to delete this preset?')) {
      onDelete(name);
    }
  }, [name, onDelete]);

  const handleExport = useCallback(() => {
    postGa('btn_click', { name: 'export-config' });
    exportConfig(state.config, name);
  }, [state.config, name]);

  const handleSubmit: FormEventHandler<HTMLFormElement> = useCallback(
    (e) => {
      e.preventDefault();
      if (!state.errors.hasErrors) {
        onSubmitChanges(name, state.config);
      } else {
        console.error('Cannot submit', state.errors);
      }
    },
    [name, onSubmitChanges, state.config, state.errors],
  );

  return (
    <form className="vertical full-height" onSubmit={handleSubmit}>
      <section className="config-editor vertical">
        <KeybindingsTable
          className="margin-vertical"
          gamepadConfig={state.config}
          errors={state.errors}
          isEditing={isEditing}
          onKeybindChange={handleKeybindChange}
        />
        <div className="margin-bottom">
          <div className="horizontal">
            <StickSelector
              readOnly={!isEditing}
              onChange={handleMouseControlsChange}
              stick={state.config.mouseConfig.mouseControls}
            />
          </div>
          <SensitivitySelector
            dispatch={dispatchState}
            disabled={noMouse}
            readOnly={!isEditing}
            sensitivity={state.config.mouseConfig.sensitivity}
          />
        </div>
      </section>
      <section className="horizontal space-between padding-top-s">
        <div className="margin-right-s">
          <DefaultButton onClick={handleToggleEditing}>{isEditing ? 'Cancel' : 'Edit'}</DefaultButton>
          {!isEditing ? (
            <DefaultButton
              className="margin-left-s"
              disabled={isDefaultConfig}
              onClick={handleDelete}
              title={isDefaultConfig ? 'Default preset cannot be deleted' : undefined}
            >
              Delete
            </DefaultButton>
          ) : null}
          {!isEditing ? (
            <DefaultButton className="margin-left-s" onClick={handleExport}>
              Export
            </DefaultButton>
          ) : null}
        </div>
        {isEditing ? (
          <PrimaryButton
            type="submit"
            disabled={state.errors.hasErrors || !hasChanges || isSubmitting}
            iconProps={saveIcon}
          >
            {isNewDraft ? 'Create' : 'Save'}
          </PrimaryButton>
        ) : (
          <PrimaryButton
            onClick={handleActivate}
            disabled={state.errors.hasErrors || isActive || isSubmitting}
            iconProps={useIcon}
          >
            Use
          </PrimaryButton>
        )}
      </section>
    </form>
  );
}

export default memo(GamepadConfigEditor);
