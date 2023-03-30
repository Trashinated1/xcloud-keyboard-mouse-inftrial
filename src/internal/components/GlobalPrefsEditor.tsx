import { Checkbox, PrimaryButton, IIconProps, Separator } from '@fluentui/react';
import React, { useCallback, FormEvent, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { updatePrefsAction } from '../state/actions';
import { getGlobalPrefs } from '../state/selectors';
import { postGa } from '../utils/ga';
import { useAppSelector } from './hooks/reduxHooks';
import ShortcutCommandsList from './ShortcutCommandsList';

const backIcon: IIconProps = { iconName: 'SkypeArrow' };

interface GlobalPrefsEditorProps {
  goBack: () => void;
}

export default function GlobalPrefsEditor({ goBack }: GlobalPrefsEditorProps) {
  const dispatch = useDispatch();
  const prefs = useAppSelector(getGlobalPrefs);
  useEffect(() => {
    postGa('page_view', { page_title: 'Global prefs editor', page_location: '/popup/prefs' });
  }, []);

  const handleChange = useCallback(
    (e?: FormEvent<HTMLElement | HTMLInputElement>, checked?: boolean) => {
      const updated = { showControlsOverlay: !!checked };
      postGa('update_prefs', updated);
      dispatch(updatePrefsAction({ ...prefs, ...updated }));
    },
    [dispatch, prefs],
  );

  return (
    <div>
      <div className="global-prefs-body">
        <section>
          <h3>Preferences</h3>
          <Checkbox
            label="Show controls cheatsheet overlay"
            checked={prefs.showControlsOverlay}
            onChange={handleChange}
            title="Show an overlay with all button bindings visible during play"
          />
        </section>
        <Separator />
        <ShortcutCommandsList />
      </div>
      <PrimaryButton iconProps={backIcon} onClick={goBack} style={{ position: 'absolute', bottom: 0 }}>
        Back
      </PrimaryButton>
    </div>
  );
}
